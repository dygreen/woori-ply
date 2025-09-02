import { NextResponse } from 'next/server'
import { db } from '@/lib/server/db'
import { finalizeVoting } from '@/lib/server/finalizeVoting'
import { Room } from '@/types'

export async function GET() {
    const database = await db()
    const rooms = database.collection<Room>('rooms')
    const now = Date.now()

    // endsAt 지난 OPEN 상태의 방을 소량씩 처리(배치 크기 제한)
    const targets = await rooms
        .find(
            {
                state: 'VOTING',
                'voting.status': 'OPEN',
                'voting.endsAt': { $lte: now },
            },
            { projection: { roomId: 1 } },
        )
        .limit(50)
        .toArray()

    for (const r of targets) {
        try {
            await finalizeVoting(database, r.roomId, 'ENDS_AT')
        } catch (e) {
            console.error('[auto-apply] failed', r.roomId, e)
        }
    }

    return NextResponse.json({ ok: true, processed: targets.length })
}
