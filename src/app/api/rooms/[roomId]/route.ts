import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/server/db'
import { Room } from '@/types'

const findRoomByRoomId = async (roomId: string) => {
    const database = await db()
    const rooms = database.collection<Room>('rooms')
    return rooms.findOne({ roomId })
}

export async function GET(
    _: NextRequest,
    { params }: { params: Promise<{ roomId: string }> },
) {
    const { roomId } = await params
    const room = await findRoomByRoomId(roomId)
    if (!room)
        return NextResponse.json(
            {
                message: 'Not Found',
            },
            {
                status: 404,
            },
        )

    if (room.status !== 'open')
        return NextResponse.json(
            {
                message: 'Room is closed',
            },
            { status: 403 },
        )

    return NextResponse.json(room)
}
