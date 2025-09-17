import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/server/db'
import { publishRoomEvent } from '@/lib/server/ably'
import { Room, Vote, VoteValue } from '@/types'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ roomId: string }> },
) {
    try {
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

        const room = await rooms.findOne({ roomId })
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
        const { round, trackId, pickerName, endsAt } = room.voting
        const userId = String(session.user.email)

        if (typeof endsAt === 'number' && now >= endsAt) {
            return NextResponse.json(
                { ok: false, message: 'VOTING_CLOSED' },
                { status: 409 },
            )
        }

        // 멱등 처리: 같은 key & 값이면 요약만 반환
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

        // 1) upsert
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

        // 2) 요약 & 브로드캐스트 (실패 무해화)
        const summary = await computeSummary(votes, roomId, round, room)
        try {
            await publishRoomEvent(roomId, 'VOTE_SUMMARY', {
                round,
                ...summary,
            })
        } catch (e) {
            console.error('[VOTE_SUMMARY publish failed]', e)
        }

        return NextResponse.json({ ok: true, yourVote: value, summary })
    } catch (e) {
        console.error('[vote] UNHANDLED', e)
        return NextResponse.json(
            { ok: false, message: 'INTERNAL_ERROR' },
            { status: 500 },
        )
    }
}

// 집계 보조
async function computeSummary(
    votesCol: any,
    roomId: string,
    round: number,
    room: Room,
) {
    const agg = await votesCol
        .aggregate([
            { $match: { roomId, round } },
            { $group: { _id: '$value', count: { $sum: 1 } } },
        ])
        .toArray()

    const up = agg.find((g: any) => g._id === 'UP')?.count ?? 0
    const down = agg.find((g: any) => g._id === 'DOWN')?.count ?? 0
    const completed = up + down
    const total = Array.isArray(room.memberOrder) ? room.memberOrder.length : 0

    return {
        up,
        down,
        completed,
        total,
        endsAt: room.voting!.endsAt,
    }
}
