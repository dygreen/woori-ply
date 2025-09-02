import { NextResponse } from 'next/server'
import { db } from '@/lib/server/db'
import { finalizeVoting } from '@/lib/server/finalizeVoting'

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ roomId: string }> },
) {
    const { roomId } = await params
    const database = await db()

    const res = await finalizeVoting(database, roomId, 'ENDS_AT', {
        allowHostTieBreak: true,
    })
    return NextResponse.json({ ok: true, ...res })
}
