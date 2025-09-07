import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, Session } from 'next-auth'
import { GET as authOptions } from '@/app/api/auth/[...nextauth]/route'
import { customAlphabet } from 'nanoid'
import { Room, RoomMember } from '@/types'
import { db } from '@/lib/server/db'
import { ObjectId } from 'mongodb'

const nanoid = customAlphabet(
    '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
    12,
)

export async function POST(req: NextRequest) {
    const session: Session | null = await getServerSession(authOptions)
    const userId = session?.user?.email
    const userName = session?.user?.name
    // 로그인 여부 체크
    if (!userId) {
        return NextResponse.json(
            {
                message: '로그인이 필요한 서비스입니다.',
            },
            { status: 401 },
        )
    }

    const roomId = nanoid()
    const database = await db()
    const rooms = database.collection<Room>('rooms')
    const members = database.collection<RoomMember>('room_members')
    const { maxSongs } = await req.json()

    const now = Date.now()
    const doc: Room = {
        _id: new ObjectId(),
        roomId,
        ownerId: userId,
        status: 'OPEN',
        state: 'IDLE',
        maxSongs,
        playlist: [],
        memberOrder: [userName ?? '알수없음'],
        turnIndex: 0,
        current: undefined,
        createdAt: now,
    }

    await rooms.insertOne(doc)
    // host를 room_members에 등록
    await members.insertOne({
        _id: new ObjectId(),
        roomId,
        userId,
        role: 'HOST',
        active: true,
        joinedAt: now,
    })

    const url = `${process.env.AUTH_URL}/rooms/${roomId}`
    return NextResponse.json({ roomId, url }, { status: 201 })
}
