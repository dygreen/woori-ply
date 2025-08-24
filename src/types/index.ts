import { ObjectId } from 'mongodb'

export type RoomStatus = 'open' | 'closed'
export type RoomRole = 'host' | 'guest'

export type User = {
    name: string
    email: string
    password: string
    createAt?: Date
    updateAt?: Date
}

export type Room = {
    _id: ObjectId
    roomId: string
    ownerId: string
    maxSongs: number
    createdAt: Date
    status: RoomStatus
    closedAt?: Date
}

export type RoomMember = {
    _id: ObjectId
    roomId: string
    userId: string
    role: RoomRole
    joinedAt: Date
    lastSeenAt: Date
    leftAt: Date
    active: boolean
}
