import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, Session } from 'next-auth'
import { GET as authOptions } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/server/db'
import { publishRoomEvent } from '@/lib/server/ably'
import { Room } from '@/types'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ roomId: string }> },
) {
    const session: Session | null = await getServerSession(authOptions)
    if (!session)
        return NextResponse.json(
            { ok: false, message: '로그인이 필요한 서비스입니다.' },
            { status: 401 },
        )

    const { roomId } = await params
    const body = await req.json()
    const { track, idempotencyKey } = body

    const database = await db()
    const rooms = database.collection<Room>('rooms')

    const room = await rooms.findOne({ roomId })
    if (!room)
        return NextResponse.json(
            { ok: false, message: 'Not found' },
            { status: 404 },
        )

    if (room.state !== 'PICKING') {
        return NextResponse.json(
            { ok: false, message: 'Invalid state' },
            { status: 400 },
        )
    }
    if (room.pickerName !== session?.user?.name) {
        return NextResponse.json(
            { ok: false, message: 'Not your turn' },
            { status: 403 },
        )
    }

    // VOTING 전이
    const endsAt = Date.now() + 20_000
    const updated = await rooms.findOneAndUpdate(
        { roomId, state: 'PICKING' },
        {
            $set: {
                state: 'VOTING',
                current: {
                    track,
                    pickerName: session?.user?.name ?? '알수없음',
                },
                voting: {
                    round: room.turnIndex,
                    trackId: track.id,
                    pickerName: session?.user?.name ?? '알수없음',
                    endsAt,
                    status: 'OPEN',
                },
            },
        },
        { returnDocument: 'after' },
    )

    // 이벤트 브로드캐스트
    await publishRoomEvent(roomId, 'TRACK_PICKED', { track })
    await publishRoomEvent(roomId, 'VOTING_STARTED', { endsAt })
    await publishRoomEvent(roomId, 'ROOM_STATE', updated)

    return NextResponse.json({ ok: true })
}
