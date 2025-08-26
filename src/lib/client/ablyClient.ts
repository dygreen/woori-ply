'use client'
import Ably from 'ably'

let realtime: Ably.Realtime | null = null

export function getAblyRealtime() {
    if (!realtime) {
        realtime = new Ably.Realtime({
            authUrl: '/api/auth/ably',
        })
    }
    return realtime
}
