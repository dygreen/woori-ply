'use client'

import { useEffect } from 'react'
import { getAblyRealtime } from '@/lib/client/ablyClient'

export function useRoomEvents(
    roomId: string,
    onEvent: (msg: { name: string; data: any }) => void,
) {
    useEffect(() => {
        const rt = getAblyRealtime()
        const channel = rt.channels.get(`room:${roomId}`)

        const handler = (msg: any) => {
            onEvent({ name: msg.name, data: msg.data })
        }

        channel.subscribe(handler)
        return () => {
            channel.unsubscribe(handler)
        }
    }, [roomId, onEvent])
}
