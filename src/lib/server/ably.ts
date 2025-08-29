import Ably from 'ably'

const client = new Ably.Rest(process.env.ABLY_API_KEY!)

export async function publishRoomEvent(
    roomId: string,
    type: string,
    payload: any,
) {
    const channel = client.channels.get(`room:${roomId}`)
    await channel.publish(type, payload)
}
