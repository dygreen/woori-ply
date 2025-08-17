import * as Ably from 'ably'

export function createAblyRealtime() {
    return new Ably.Realtime({
        authUrl: '/api/auth/ably',
        echoMessages: true,
    })
}
