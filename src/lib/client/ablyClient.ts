'use client'
import Ably from 'ably'

let realtime: Ably.Realtime | null = null

export function getAblyRealtime() {
    if (!realtime) {
        realtime = new Ably.Realtime({
            authUrl: '/api/auth/ably',
            echoMessages: false,
            // v2는 기본 Promise API라 별도 .Promise 생성자 불필요
        })
    }
    return realtime
}
