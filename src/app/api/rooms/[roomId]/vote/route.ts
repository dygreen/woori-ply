// src/app/api/rooms/[roomId]/vote/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/server/db'
import { ObjectId } from 'mongodb'
import { publishRoomEvent } from '@/lib/server/ably'
import { finalizeRound } from '@/lib/server/finalize' // 래퍼: channel.publish(type, data)

export async function POST(
    req: NextRequest,
    { params }: { params: { roomId: string } },
) {
    const session = await getServerSession()
    if (!session?.user?.name)
        return NextResponse.json(
            { message: '로그인이 필요한 서비스입니다.' },
            { status: 401 },
        )

    const { value, idempotencyKey } = await req.json()
    if (value !== 'UP' && value !== 'DOWN') {
        return NextResponse.json(
            { ok: false, message: 'INVALID_VALUE' },
            { status: 400 },
        )
    }
    if (!idempotencyKey) {
        return NextResponse.json(
            { ok: false, message: 'MISSING_KEY' },
            { status: 400 },
        )
    }

    const database = await db()
    const rooms = database.collection('rooms')
    const votes = database.collection('votes')

    // 1) 룸 상태 확인
    const room = await rooms.findOne({ roomId: params.roomId })
    if (!room)
        return NextResponse.json(
            { ok: false, message: 'ROOM_NOT_FOUND' },
            { status: 404 },
        )

    if (
        room.state !== 'VOTING' ||
        !room.voting ||
        room.voting.status !== 'OPEN'
    ) {
        return NextResponse.json(
            { ok: false, message: 'NOT_VOTING' },
            { status: 409 },
        )
    }
    const now = Date.now()
    if (now >= room.voting.endsAt) {
        // 이미 마감 시각 지남 → 클라이언트는 잠시후 ROOM_STATE/APPLIED 받을 것
        return NextResponse.json(
            { ok: false, message: 'ENDED' },
            { status: 409 },
        )
    }

    const round = room.voting.round
    const roomObjId = new ObjectId(room._id)
    const userId = String(session.user.email)

    // 2) 같은 키로 이미 처리했나?
    const existing = await votes.findOne({ roomId: roomObjId, round, userId })
    if (
        existing &&
        existing.lastKey === idempotencyKey &&
        existing.value === value
    ) {
        // 멱등 재시도 → 요약만 돌려주기
        const summary = await computeSummary(votes, roomObjId, round, room)
        return NextResponse.json({
            ok: true,
            yourVote: existing.value,
            summary,
        })
    }

    // 3) upsert (유저의 이전 표 제거 + 새 표 추가 = 값만 교체)
    await votes.updateOne(
        { roomId: roomObjId, round, userId },
        { $set: { value, updatedAt: new Date(), lastKey: idempotencyKey } },
        { upsert: true },
    )

    // 4) (선택) 빠른 요약 브로드캐스트
    const summary = await computeSummary(votes, roomObjId, round, room)
    try {
        await publishRoomEvent(`room:${room.roomId}`, 'VOTE_SUMMARY', {
            round,
            ...summary,
        })
    } catch {
        /* 브로드캐스트 실패는 무시 */
    }

    // 5) 조기 마감 체크: 완료 수 === active 멤버 수
    const earlyCloseEnabled = summary.total >= 2 // 최소 2명 이상일 때만
    if (earlyCloseEnabled && summary.completed >= summary.total) {
        await finalizeRound(database, room)
    }

    return NextResponse.json({ ok: true, yourVote: value, summary })
}

// 집계 보조
async function computeSummary(
    votesCol: any,
    roomId: ObjectId,
    round: number,
    room: any,
) {
    const agg = await votesCol
        .aggregate([
            { $match: { roomId, round } },
            {
                $group: {
                    _id: null,
                    up: { $sum: { $cond: [{ $eq: ['$value', 'UP'] }, 1, 0] } },
                    down: {
                        $sum: { $cond: [{ $eq: ['$value', 'DOWN'] }, 1, 0] },
                    },
                    completed: { $sum: 1 },
                },
            },
        ])
        .toArray()

    const up = agg[0]?.up ?? 0
    const down = agg[0]?.down ?? 0
    const completed = agg[0]?.completed ?? 0
    const total =
        (room.members || []).filter((m: any) => m.active).length ||
        (room.members || []).length ||
        0

    return { up, down, completed, total, endsAt: room.voting.endsAt }
}
