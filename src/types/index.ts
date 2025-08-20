import { ObjectId } from 'mongodb'

type RoomStatus = 'open' | 'closed'

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
