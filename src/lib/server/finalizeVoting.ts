import { publishRoomEvent } from '@/lib/server/ably'

type Reason = 'ENDS_AT' | 'ALL_VOTED'

export async function finalizeVoting(
    database: any,
    roomId: string,
    reason: Reason,
    opts?: { allowHostTieBreak?: boolean },
) {
    const rooms = database.collection('rooms')
    const votes = database.collection('votes')

    // 1) 최신 룸 스냅샷 확보 (room 인자로 받지 않음: stale 방지)
    const room = await rooms.findOne({ roomId })
    if (!room || room.state !== 'VOTING' || !room.voting)
        return { skipped: true }

    const now = Date.now()

    // 2) 락: OPEN → APPLYING (중복 집계 방지)
    const lockQuery: any = {
        _id: room._id,
        state: 'VOTING',
        'voting.status': 'OPEN',
    }
    if (reason === 'ENDS_AT') {
        lockQuery['voting.endsAt'] = { $lte: now }
    }

    const locked = await rooms.findOneAndUpdate(
        lockQuery,
        { $set: { 'voting.status': 'APPLYING' } },
        { returnDocument: 'after' },
    )
    const lockedRoom = locked.value ?? (await rooms.findOne({ _id: room._id }))
    if (!lockedRoom || lockedRoom.voting?.status !== 'APPLYING') {
        return { skipped: true } // 이미 누가 집계 중이거나 완료됨
    }

    const { round, trackId, pickerId } = lockedRoom.voting

    // 3) 집계 (이 라운드+트랙 기준)
    const agg = await votes
        .aggregate([
            { $match: { roomId, round, trackId } },
            { $group: { _id: '$value', count: { $sum: 1 } } },
        ])
        .toArray()
    const upCount = agg.find((g: { _id: string }) => g._id === 'UP')?.count ?? 0
    const downCount =
        agg.find((g: { _id: string }) => g._id === 'DOWN')?.count ?? 0

    // 4) 채택 규칙
    let accepted = upCount > downCount
    const hostVote = await votes.findOne({
        roomId,
        round,
        userId: room.ownerId,
    })
    if (!accepted && upCount === downCount && opts?.allowHostTieBreak) {
        // 동률 시 호스트 캐스팅 보너스: 간단히 채택으로 처리(원하면 호스트 표 조회로 강화)
        accepted = hostVote?.value === 'UP'
    }

    // 5) 다음 턴/상태 결정
    const targetCount = lockedRoom.targetCount ?? lockedRoom.maxSongs // 두 네이밍 모두 대응
    const willFinish =
        (lockedRoom.playlist?.length ?? 0) + (accepted ? 1 : 0) >= targetCount

    const memberOrder: string[] = lockedRoom.memberOrder ?? []
    const nextTurnIndex = memberOrder.length
        ? (lockedRoom.turnIndex + 1) % memberOrder.length
        : lockedRoom.turnIndex + 1

    const nextPickerId = memberOrder.length
        ? memberOrder[nextTurnIndex]
        : undefined
    const nextState: 'FINISHED' | 'PICKING' = willFinish
        ? 'FINISHED'
        : 'PICKING'
    const trackSnapshot = lockedRoom?.current?.track

    // 6) 업데이트(플레이리스트/상태 전이/cleanup)
    const updates: any = {
        $set: {
            state: nextState,
            turnIndex: nextTurnIndex,
            // 다음 라운드를 위해 picker 지정(종료면 undefined로 두거나 필드 제거)
            ...(willFinish
                ? { pickerId: undefined }
                : { pickerId: nextPickerId }),
            current: undefined, // 진행 곡 스냅샷 정리
        },
        $unset: { voting: '' }, // 라운드 종료
    }
    if (accepted) {
        updates.$push = {
            playlist: {
                trackId,
                pickerId,
                addedAt: now,
                ...(trackSnapshot ? { track: trackSnapshot } : {}),
            },
        }
    }

    const updated = await rooms.findOneAndUpdate(
        { _id: lockedRoom._id },
        updates,
        { returnDocument: 'after' },
    )
    const updatedRoom = updated.value

    // 7) 이벤트 브로드캐스트
    await publishRoomEvent(roomId, 'APPLIED', {
        round,
        trackId,
        pickerId,
        upCount,
        downCount,
        accepted,
        reason,
        nextState,
        nextTurnIndex,
        nextPickerId,
        newPlaylistLen: updatedRoom?.playlist?.length ?? 0,
    })
    await publishRoomEvent(roomId, 'ROOM_STATE', {
        _id: updatedRoom?._id,
        roomId: updatedRoom?.roomId,
        state: updatedRoom?.state,
        turnIndex: updatedRoom?.turnIndex,
        pickerId: updatedRoom?.pickerId,
        playlist: updatedRoom?.playlist,
        maxSongs: updatedRoom?.maxSongs,
        targetCount: updatedRoom?.targetCount,
        memberOrder: updatedRoom?.memberOrder,
        createdAt: updatedRoom?.createdAt,
        closedAt: updatedRoom?.closedAt,
    })

    return {
        applied: true,
        accepted,
        counts: { up: upCount, down: downCount },
        nextState,
    }
}
