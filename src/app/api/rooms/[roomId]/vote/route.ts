import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/server/db'
import { publishRoomEvent } from '@/lib/server/ably'
import { finalizeVoting } from '@/lib/server/finalizeVoting'
import { Room, Vote, VoteValue } from '@/types'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ roomId: string }> },
) {
    const session = await getServerSession()
    if (!session?.user?.email) {
        return NextResponse.json(
            { message: '로그인이 필요한 서비스입니다.' },
            { status: 401 },
        )
    }

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

    const { roomId } = await params
    const database = await db()
    const rooms = database.collection<Room>('rooms')
    const votes = database.collection<Vote>('votes')

    // 최신 룸 스냅샷
    const room = await rooms.findOne({ roomId })
    if (!room) {
        return NextResponse.json(
            { ok: false, message: 'ROOM_NOT_FOUND' },
            { status: 404 },
        )
    }
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
    const { round, trackId, pickerName, endsAt } = room.voting
    const userId = String(session.user.email)

    // ── 1) 멱등 처리: 같은 key로 같은 값이면 요약만 리턴
    const existing = await votes.findOne({ roomId, round, userId })
    if (
        existing &&
        existing.lastKey === idempotencyKey &&
        existing.value === value
    ) {
        const summary = await computeSummary(votes, roomId, round, room)
        return NextResponse.json({
            ok: true,
            yourVote: existing.value,
            summary,
        })
    }

    // ── 2) endsAt 지나 있음 → 여기서 바로 서버 마감 시도(멱등 안전)
    if (typeof endsAt === 'number' && now >= endsAt) {
        await finalizeVoting(database, roomId, 'ENDS_AT')
        return NextResponse.json({ ok: true, message: 'ENDED_APPLYING' })
    }

    // ── 3) 표 upsert (1인 1표: 값 교체)
    await votes.updateOne(
        { roomId, round, userId },
        {
            $set: {
                roomId,
                round,
                trackId,
                pickerName,
                userId,
                value: value as VoteValue,
                updatedAt: now,
                lastKey: idempotencyKey,
            },
            $setOnInsert: { createdAt: now },
        },
        { upsert: true },
    )

    // ── 4) 중간 요약 브로드캐스트 (선택)
    const summary = await computeSummary(votes, roomId, round, room)
    try {
        await publishRoomEvent(roomId, 'VOTE_SUMMARY', { round, ...summary })
    } catch (e) {
        console.error('VOTE_SUMMARY publish failed:', e)
    }

    // ── 5) 전원 투표 완료 시 즉시 마감
    const allVoted = summary.completed >= room.memberOrder.length
    if (allVoted) {
        await finalizeVoting(database, roomId, 'ALL_VOTED')
    }

    return NextResponse.json({ ok: true, yourVote: value, summary })
}

// 집계 보조: 이 라운드의 합계/완료/총원 계산
async function computeSummary(
    votesCol: any,
    roomId: string,
    round: number,
    room: Room,
) {
    const agg = await votesCol
        .aggregate([
            { $match: { roomId, round } },
            {
                $group: {
                    _id: '$value',
                    count: { $sum: 1 },
                },
            },
        ])
        .toArray()

    const up = agg.find((g: any) => g._id === 'UP')?.count ?? 0
    const down = agg.find((g: any) => g._id === 'DOWN')?.count ?? 0
    const completed = up + down

    return {
        up,
        down,
        completed,
        total: room.memberOrder.length,
        endsAt: room.voting!.endsAt,
    }
}
