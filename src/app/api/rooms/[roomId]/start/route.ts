import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, Session } from 'next-auth'
import { GET as authOptions } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/server/db'
import { publishRoomEvent } from '@/lib/server/ably'

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ roomId: string }> },
) {
    const session: Session | null = await getServerSession(authOptions)
    if (!session)
        return NextResponse.json(
            { ok: false, message: '로그인이 필요한 서비스입니다.' },
            { status: 401 },
        )

    const { roomId } = await params
    const database = await db()
    const rooms = database.collection('rooms')

    const room = await rooms.findOne({ roomId })
    if (!room) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // host 검증
    if (room.ownerId !== session?.user?.email) {
        return NextResponse.json(
            {
                ok: false,
                error: '방장만 시작할 수 있어요. 방장이 준비되면 시작됩니다.',
            },
            { status: 403 },
        )
    }

    if (room.state !== 'IDLE') {
        return NextResponse.json(
            { ok: false, message: 'Invalid state' },
            { status: 400 },
        )
    }

    // PICKING 전이
    const nextPickerName = room.memberOrder[room.turnIndex ?? 0]

    const updated = await rooms.findOneAndUpdate(
        { roomId, state: 'IDLE' },
        {
            $set: {
                state: 'PICKING',
                pickerName: nextPickerName,
            },
        },
        { returnDocument: 'after' },
    )

    // 이벤트 브로드캐스트
    await publishRoomEvent(roomId, 'TURN_STARTED', {
        pickerName: nextPickerName,
    })
    await publishRoomEvent(roomId, 'ROOM_STATE', updated)

    return NextResponse.json({ ok: true })
}
