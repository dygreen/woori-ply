import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, Session } from 'next-auth'
import { GET } from '@/app/api/auth/[...nextauth]/route'
import { customAlphabet } from 'nanoid'
import { Room } from '@/types'
import { db } from '@/lib/server/db'
import { ObjectId } from 'mongodb'

const nanoid = customAlphabet(
    '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
    12,
)

const insertRoom = async (doc: Omit<Room, '_id' | 'createdAt' | 'status'>) => {
    const database = await db()
    const rooms = database.collection<Room>('rooms')
    const toInsert: Room = {
        ...doc,
        _id: new ObjectId(),
        createdAt: new Date(),
        status: 'open',
    }
    await rooms.insertOne(toInsert)
    return toInsert
}

export async function POST(req: NextRequest) {
    const session: Session | null = await getServerSession(GET)
    // 로그인 여부 체크
    if (!session?.user?.email) {
        return NextResponse.json(
            {
                message: '로그인이 필요한 서비스입니다.',
            },
            { status: 401 },
        )
    }

    const roomId = nanoid()
    const { maxSongs } = await req.json()
    const room = await insertRoom({
        roomId,
        ownerId: session.user.email,
        maxSongs,
    })

    const url = `${process.env.AUTH_URL}/rooms/${room.roomId}`
    return NextResponse.json({ roomId: room.roomId, url }, { status: 201 })
}
