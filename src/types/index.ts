import { ObjectId } from 'mongodb'

export type RoomStatus = 'open' | 'closed'
export type RoomRole = 'host' | 'guest'
export type RoomState = 'IDLE' | 'PICKING' | 'VOTING' | 'APPLYING' | 'FINISHED'

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
    status: RoomStatus
    state: RoomState
    maxSongs: number
    playlist: { trackId: string; pickerId: string; addedAt: number }[]
    memberOrder: string[]
    turnIndex: number
    pickerId?: string
    pickerName?: string
    current?: {
        pickerId?: string
        pickerName?: string
        track: {
            id: string
            name: string
            artists: string
            album: SpotifyAlbum
            durationMs: number
            previewUrl: string | null
        }
        vote?: { endsAt: number; up: string[]; down: string[] }
    }
    createdAt: Date
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

export type ChatMessage = {
    id: string
    roomId: string
    userId: string
    userName?: string
    text: string
    createdAt: number
    type?: 'text' | 'system'
}

export type PresenceMember = {
    clientId: string
    name?: string
    joinedAt?: number
}

export type SpotifyTrack = {
    id: string
    name: string
    artists: string
    album: SpotifyAlbum
    durationMs: number
    previewUrl: string | null
}

export type SpotifyAlbum = {
    id: string
    name: string
    images: SpotifyImage[]
}
export type SpotifyImage = { url: string; width: number; height: number }
