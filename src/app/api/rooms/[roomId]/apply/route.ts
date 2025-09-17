import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/server/db'
import { finalizeVoting } from '@/lib/server/finalizeVoting'
import { Room, Vote } from '@/types'

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

    const { roomId } = await params
    let { reason } = await req.json()

    try {
        const database = await db()
        const rooms = database.collection<Room>('rooms')
        const votes = database.collection<Vote>('votes')

        const room = await rooms.findOne({ roomId })
        if (!room || room.state !== 'VOTING' || !room.voting) {
            return NextResponse.json({ ok: true, skipped: true })
        }

        if (!reason) {
            const now = Date.now()
            if (
                typeof room.voting.endsAt === 'number' &&
                now >= room.voting.endsAt
            ) {
                reason = 'ENDS_AT'
            } else {
                // ALL_VOTED 자동 판정
                const round = room.voting.round
                const agg = await votes
                    .aggregate([
                        { $match: { roomId, round } },
                        { $group: { _id: '$value', count: { $sum: 1 } } },
                    ])
                    .toArray()
                const up = agg.find((g: any) => g._id === 'UP')?.count ?? 0
                const down = agg.find((g: any) => g._id === 'DOWN')?.count ?? 0
                const completed = up + down
                const total = Array.isArray(room.memberOrder)
                    ? room.memberOrder.length
                    : 0
                if (completed >= total) reason = 'ALL_VOTED'
            }
        }

        if (!reason) return NextResponse.json({ ok: true, skipped: true })

        const result = await finalizeVoting(database, roomId, reason)
        return NextResponse.json({ ok: true, ...result })
    } catch (e: any) {
        console.error('[apply] finalize failed:', e)
        return NextResponse.json(
            { ok: false, message: e?.message ?? 'FINALIZE_FAILED' },
            { status: 500 },
        )
    }
}
