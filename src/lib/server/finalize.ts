import { publishRoomEvent } from '@/lib/server/ably'

export async function finalizeRound(database: any, room: any) {
    const rooms = database.collection('rooms')
    const votes = database.collection('votes')
    const roomId = room.roomId

    // 1) 락: OPEN → APPLYING
    const locked = await rooms.findOneAndUpdate(
        { _id: room._id, 'voting.status': 'OPEN', state: 'VOTING' },
        { $set: { 'voting.status': 'APPLYING' } },
        { returnDocument: 'after' },
    )
    if (!locked.value) return // 이미 누군가 집계 중/완료

    // 2) 최종 집계
    const round = room.voting.round
    const agg = await votes
        .aggregate([
            { $match: { roomId, round } },
            {
                $group: {
                    _id: null,
                    up: { $sum: { $cond: [{ $eq: ['$value', 'UP'] }, 1, 0] } },
                    down: {
                        $sum: { $cond: [{ $eq: ['$value', 'DOWN'] }, 1, 0] },
                    },
                },
            },
        ])
        .toArray()
    const up = agg[0]?.up ?? 0
    const down = agg[0]?.down ?? 0

    // (선택) 동률 시 host 보너스
    const hostBonus = false
    const accepted = hostBonus ? up >= down : up > down

    // 3) 결과 반영 (플레이리스트 추가 + 다음 상태 전이)
    const updates: any = { $set: { 'voting.status': 'APPLIED' } }

    if (accepted) {
        updates.$push = {
            playlist: {
                trackId: room.voting.trackId,
                pickerId: room.voting.pickerId,
                addedAt: new Date(),
            },
        }
    }

    // turnIndex 증가 및 다음 상태 계산
    const nextTurnIndex = room.turnIndex + 1
    const willFinish =
        (room.playlist?.length ?? 0) + (accepted ? 1 : 0) >= room.targetCount
    updates.$set.state = willFinish ? 'FINISHED' : 'PICKING'
    updates.$set.turnIndex = nextTurnIndex
    updates.$unset = { voting: '' } // 현재 라운드 종료

    const updated = await rooms.findOneAndUpdate({ _id: room._id }, updates, {
        returnDocument: 'after',
    })

    // 4) 브로드캐스트
    await publishRoomEvent(roomId, 'APPLIED', {
        round,
        accepted,
        up,
        down,
        trackId: room.voting.trackId,
    })
    await publishRoomEvent(roomId, 'ROOM_STATE', {
        state: updated.value.state,
        turnIndex: updated.value.turnIndex,
        playlist: updated.value.playlist,
    })
}
