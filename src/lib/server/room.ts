import * as Ably from 'ably'
import { db } from '@/lib/server/db'
import { Room } from '@/types'

export async function closeRoomInDBAndNotify(roomId: string) {
    const database = await db()
    const rooms = database.collection<Room>('rooms')

    const result = await rooms.updateOne(
        { roomId, status: { $ne: 'CLOSED' } },
        { $set: { status: 'CLOSED', closedAt: Date.now() } },
    )

    if (result.modifiedCount === 1) {
        const ably = new Ably.Rest(process.env.ABLY_API_KEY!)
        const channel = ably.channels.get(`room:${roomId}`)
        await channel.publish('roomClosed', {
            roomId,
            closedAt: Date.now(),
            reason: 'empty', // 마지막 인원 퇴장으로 닫힘
        })
    }

    return { ok: true }
}
