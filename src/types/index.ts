import { ObjectId } from 'mongodb'

export type RoomStatus = 'OPEN' | 'CLOSED'
export type RoomRole = 'HOST' | 'GUEST'
export type RoomState = 'IDLE' | 'PICKING' | 'VOTING' | 'APPLYING' | 'FINISHED'

export type VoteValue = 'UP' | 'DOWN'
export type VotingStatus = 'OPEN' | 'APPLYING' | 'APPLIED'

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
    playlist: Playlist[]
    memberOrder: string[]
    turnIndex: number
    pickerId?: string
    pickerName?: string
    current?: {
        pickerId?: string
        pickerName?: string
        track: Track
    }
    voting?: RoomVoting
    createdAt: Date
    closedAt?: Date
}

export type Playlist = {
    trackId: string
    pickerId: string
    pickerName: string
    addedAt: number
    track?: Track
}

type Track = {
    id: string
    name: string
    artists: string
    album: SpotifyAlbum
    durationMs: number
    previewUrl: string | null
}

export type RoomVoting = {
    round: number
    trackId: string
    pickerId: string
    endsAt: number
    status: VotingStatus
    upCount?: number
    downCount?: number
    accepted?: boolean
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

// 개별 유저의 투표 기록
export type Vote = {
    _id: ObjectId
    roomId: ObjectId
    round: number
    userId: string
    value: VoteValue
    lastKey?: string // 마지막 처리한 idempotencyKey
    updatedAt: Date
}
