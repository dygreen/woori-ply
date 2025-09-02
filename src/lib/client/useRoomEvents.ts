'use client'

import { useEffect } from 'react'
import { getAblyRealtime } from '@/lib/client/ablyClient'

export function useRoomEvents(
    roomId: string,
    onEvent: (msg: { name: string; data: any }) => void,
) {
    useEffect(() => {
        if (!roomId) return // roomId 아직 없는 첫 렌더 가드

        const rt = getAblyRealtime()
        const channelName = `room:${roomId}`
        const channel = rt.channels.get(channelName)

        const handler = (msg: any) => {
            // 디버그
            console.log('[ably][recv]', channelName, msg.name, msg.data)
            onEvent({ name: msg.name, data: msg.data })
        }

        console.log('[ably][sub]', channelName)
        channel.subscribe(handler)

        return () => {
            console.log('[ably][unsub]', channelName)
            channel.unsubscribe(handler)
        }
    }, [roomId, onEvent])
}
