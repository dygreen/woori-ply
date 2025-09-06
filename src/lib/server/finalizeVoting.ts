// lib/server/finalizeVoting.ts
import { Db } from 'mongodb'
import { publishRoomEvent } from '@/lib/server/ably'
import { Room } from '@/types'

type Reason = 'ENDS_AT' | 'ALL_VOTED' | 'FORCE'
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
    reason: Reason,
    opts?: { allowHostTieBreak?: boolean },
): Promise<FinalizeResult> {
    const rooms = database.collection<Room>('rooms')
    const votes = database.collection('votes')

    // 1) 최신 룸 스냅샷
    const room = await rooms.findOne({ roomId })
    if (!room || room.state !== 'VOTING' || !room.voting) {
        return { skipped: true }
    }

    const now = Date.now()
    const staleMs = 15_000 // APPLYING이 이 시간 이상이면 강제 재락 허용

    // 2) 락: OPEN → APPLYING (+ FORCE 복구용 APPLYING stale 허용)
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
                // APPLYING 이지만 오래된 경우(이전 집계가 죽었을 때) 강제 재락
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

    const lockRes = await rooms.findOneAndUpdate(
        lockFilter,
        { $set: { 'voting.status': 'APPLYING', 'voting.applyAt': now } },
        { returnDocument: 'after' },
    )

    const lockedRoom = lockRes?.value
    if (!lockedRoom) {
        // 왜 안잡혔는지 진단용 로그(원하면 유지)
        // const cur = await rooms.findOne({ _id: room._id }, { projection: { state: 1, voting: 1 } })
        // console.log('[finalize] lock miss', { reason, now, cur })
        return { skipped: true }
    }

    const { round, trackId, pickerId } = lockedRoom.voting!

    // 3) 집계: 트랙 기준 → 0표면 라운드 기준 폴백
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

    // 4) 채택 규칙 (+ 호스트 타이브레이크)
    let accepted = upCount > downCount
    if (!accepted && upCount === downCount && opts?.allowHostTieBreak) {
        const hostVote = await votes.findOne({
            roomId,
            round,
            userId: lockedRoom.ownerId,
        })
        accepted = hostVote?.value === 'UP'
    }

    // 5) 다음 상태/턴 계산
    const targetCount =
        (lockedRoom as any).targetCount ?? lockedRoom.maxSongs ?? 10
    const willLen = (lockedRoom.playlist?.length ?? 0) + (accepted ? 1 : 0)
    const willFinish = willLen >= targetCount

    const order = lockedRoom.memberOrder ?? []
    const currTurn = lockedRoom.turnIndex ?? 0
    const nextTurn = order.length ? (currTurn + 1) % order.length : currTurn + 1
    const nextPickerId = order.length ? order[nextTurn] : undefined
    const nextState: 'PICKING' | 'FINISHED' = willFinish
        ? 'FINISHED'
        : 'PICKING'

    const trackSnapshot = lockedRoom.current?.track
    const pickerNameSnapshot = lockedRoom.current?.pickerName

    // 6-A) playlist push를 단독으로 먼저 수행
    if (accepted) {
        await rooms.updateOne(
            { _id: lockedRoom._id },
            {
                $push: {
                    playlist: {
                        trackId,
                        pickerId,
                        addedAt: now,
                        ...(pickerNameSnapshot
                            ? { pickerName: pickerNameSnapshot }
                            : {}),
                        ...(trackSnapshot ? { track: trackSnapshot } : {}),
                    },
                },
            },
        )
    }

    // 6-B) 상태 전이 + voting APPLIED + applyAt 정리 + current 정리
    await rooms.updateOne(
        { _id: lockedRoom._id },
        {
            $set: {
                state: nextState,
                turnIndex: nextTurn,
                ...(willFinish
                    ? { pickerId: undefined }
                    : { pickerId: nextPickerId }),
                voting: {
                    ...lockedRoom.voting!,
                    upCount,
                    downCount,
                    status: 'APPLIED',
                },
            },
            $unset: { current: '', 'voting.applyAt': '' },
        },
    )

    // 최종 스냅샷
    const updated = (await rooms.findOne({
        _id: lockedRoom._id,
    })) as Room | null
    if (!updated) return { skipped: true }

    // 7) 이벤트
    try {
        await publishRoomEvent(roomId, 'APPLIED', {
            round,
            trackId,
            pickerId,
            upCount,
            downCount,
            accepted,
            reason,
            nextState,
            nextTurnIndex: nextTurn,
            nextPickerId,
            newPlaylistLen: updated.playlist?.length ?? willLen,
        })
    } catch (e) {
        console.error('[APPLIED publish failed]', e)
    }

    try {
        await publishRoomEvent(roomId, 'ROOM_STATE', updated) // Full Room
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
