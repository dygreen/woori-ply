import { Db } from 'mongodb'
import { publishRoomEvent } from '@/lib/server/ably'
import { Room, Vote, VotingReason } from '@/types'

type FinalizeResult =
    | { skipped: true }
    | {
          skipped: false
          accepted: boolean
          upCount: number
          downCount: number
          nextState: 'PICKING' | 'FINISHED'
          updated?: Room
      }

export async function finalizeVoting(
    database: Db,
    roomId: string,
    reason: VotingReason,
    opts?: { allowHostTieBreak?: boolean },
): Promise<FinalizeResult> {
    const rooms = database.collection<Room>('rooms')
    const votes = database.collection<Vote>('votes')

    const room = await rooms.findOne({ roomId })
    // console.log('room.state : ', room.state)
    // console.log('room.voting : ', room.voting)
    if (!room || room.state !== 'VOTING' || !room.voting) {
        return { skipped: true }
    }

    const now = Date.now()
    const staleMs = 15_000

    const base = {
        _id: room._id,
        state: 'VOTING',
        'voting.round': room.voting.round,
    } as const

    let lockFilter: any
    if (reason === 'ENDS_AT') {
        lockFilter = {
            ...base,
            'voting.status': 'OPEN',
            'voting.endsAt': { $lte: now },
        }
    } else if (reason === 'FORCE') {
        lockFilter = {
            ...base,
            $or: [
                { 'voting.status': 'OPEN' },
                {
                    'voting.status': 'APPLYING',
                    'voting.applyAt': { $lte: now - staleMs },
                },
            ],
        }
    } else {
        // ALL_VOTED
        lockFilter = { ...base, 'voting.status': 'OPEN' }
    }

    // console.log('lockFilter : ', lockFilter)
    const lockRes = await rooms.findOneAndUpdate(
        lockFilter,
        { $set: { 'voting.status': 'APPLYING', 'voting.applyAt': now } },
        { returnDocument: 'after' },
    )

    // console.log('lockRes : ', lockRes)
    if (!lockRes) {
        return { skipped: true }
    }

    const { round, trackId, pickerName } = lockRes.voting!

    // 집계: 트랙 기준 → 0표면 라운드 기준 폴백
    const aggWithTrack = await votes
        .aggregate([
            { $match: { roomId, round, trackId } },
            { $group: { _id: '$value', count: { $sum: 1 } } },
        ])
        .toArray()

    let upCount = aggWithTrack.find((g: any) => g._id === 'UP')?.count ?? 0
    let downCount = aggWithTrack.find((g: any) => g._id === 'DOWN')?.count ?? 0
    if (upCount + downCount === 0) {
        const aggRoundOnly = await votes
            .aggregate([
                { $match: { roomId, round } },
                { $group: { _id: '$value', count: { $sum: 1 } } },
            ])
            .toArray()
        upCount = aggRoundOnly.find((g: any) => g._id === 'UP')?.count ?? 0
        downCount = aggRoundOnly.find((g: any) => g._id === 'DOWN')?.count ?? 0
    }

    // 채택 규칙 (+ 호스트 타이브레이크)
    let accepted = upCount > downCount
    if (!accepted && upCount === downCount && opts?.allowHostTieBreak) {
        const hostVote = await votes.findOne({
            roomId,
            round,
            userId: lockRes.ownerId,
        })
        accepted = hostVote?.value === 'UP'
    }

    // 다음 상태/턴 계산
    const targetCount = (lockRes as any).targetCount ?? lockRes.maxSongs ?? 10
    const willLen = (lockRes.playlist?.length ?? 0) + (accepted ? 1 : 0)
    const willFinish = willLen >= targetCount

    const order = lockRes.memberOrder ?? []
    const currTurn = lockRes.turnIndex ?? 0
    const nextTurn = order.length ? (currTurn + 1) % order.length : currTurn + 1
    const nextPickerName = order.length ? order[nextTurn] : undefined
    const nextState: 'PICKING' | 'FINISHED' = willFinish
        ? 'FINISHED'
        : 'PICKING'
    const nextRound = (lockRes.voting?.round ?? -1) + 1

    const trackSnapshot = lockRes.current?.track

    const setOps: any = {
        state: nextState,
        'voting.upCount': upCount,
        'voting.downCount': downCount,
        'voting.status': 'APPLIED',
    }
    const unsetOps: any = {
        'voting.applyAt': '',
    }
    const pushOps: any = {}

    if (accepted) {
        pushOps['playlist'] = {
            trackId,
            pickerName,
            addedAt: now,
            ...(trackSnapshot ? { track: trackSnapshot } : {}),
        }
    }

    if (nextState === 'PICKING') {
        // 다음 차례 지정: current 를 오직 pickerName만 가진 상태로 재설정
        setOps['turnIndex'] = nextTurn
        if (nextPickerName) {
            setOps['current'] = { pickerName: nextPickerName }
            setOps['pickerName'] = nextPickerName
        } else {
            // 멤버가 없다면 current 비움
            unsetOps['current'] = ''
            unsetOps['pickerName'] = ''
        }

        setOps['voting'] = {
            round: nextRound,
            // status: 'IDLE', // /pick에서 OPEN으로 전환
            // upCount: 0,
            // downCount: 0,
            // trackId/endsAt/applyAt 등은 비움; /pick에서 세팅
        }
    } else {
        // FINISHED: current / pickerName 정리
        unsetOps['current'] = ''
        unsetOps['pickerName'] = ''
    }

    const updateOps: any = { $set: setOps, $unset: unsetOps }
    if (accepted) updateOps.$push = pushOps

    await rooms.updateOne({ _id: lockRes._id }, updateOps)

    // 최종 스냅샷
    const updated = (await rooms.findOne({ _id: lockRes._id })) as Room | null
    if (!updated) return { skipped: true }

    // 이벤트
    try {
        await publishRoomEvent(roomId, 'APPLIED', {
            round,
            trackId,
            pickerName,
            upCount,
            downCount,
            accepted,
            reason,
            nextState,
            nextTurnIndex: updated.turnIndex,
            nextPickerName: updated.current?.pickerName ?? updated.pickerName,
            newPlaylistLen: updated.playlist?.length ?? willLen,
            playlist: updated.playlist,
        })
    } catch (e) {
        console.error('[APPLIED publish failed]', e)
    }

    try {
        await publishRoomEvent(roomId, 'ROOM_STATE', updated)
    } catch (e) {
        console.error('[ROOM_STATE publish failed]', e)
    }

    return {
        skipped: false,
        accepted,
        upCount,
        downCount,
        nextState,
        updated: updated ?? undefined,
    }
}
