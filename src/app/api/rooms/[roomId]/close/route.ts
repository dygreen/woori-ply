import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/server/db'
import { Room } from '@/types'

export async function POST(req: NextRequest, context: any) {
    const { userId } = await req.json()
    const database = await db()
    const rooms = database.collection<Room>('rooms')

    const { roomId } = context.params
    const room = await rooms.findOne({ roomId })
    if (!room) {
        return NextResponse.json(
            { message: '존재하지 않는 방입니다.' },
            { status: 404 },
        )
    }

    if (room.ownerId === userId) {
        await rooms.updateOne(
            { roomId },
            { $set: { status: 'closed', closedAt: new Date() } },
        )
        return NextResponse.json({ ok: true })
    }
}
