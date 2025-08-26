'use client'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { getAblyRealtime } from '@/lib/client/ablyClient'
import { ChatMessage, PresenceMember } from '@/types'
import Ably from 'ably'

type Options = { roomId: string; fetchHistory?: boolean; pageSize?: number }

export function useRoomChat({ roomId }: Options) {
    const rt = useMemo(() => getAblyRealtime(), [])
    const channel = useMemo(
        () => rt.channels.get(`room:${roomId}`),
        [rt, roomId],
    )

    const [connected, setConnected] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [members, setMembers] = useState<PresenceMember[]>([])

    // 메시지 수신
    useEffect(() => {
        if (!channel) return
        const onMsg = (msg: Ably.Message) => {
            setMessages((prev) => [...prev, msg.data as ChatMessage])
        }
        channel.subscribe('chat', onMsg)
        return () => channel.unsubscribe('chat', onMsg)
    }, [channel])

    // presence
    const refreshMembers = useCallback(async () => {
        const pres = await channel.presence.get()
        setMembers(
            pres.map((p) => ({
                clientId: p.clientId,
                name: p.data?.name,
                joinedAt: p.timestamp,
            })),
        )
    }, [channel])

    useEffect(() => {
        let mounted = true
        const connectHandler = () => setConnected(true)
        const disconnectHandler = () => setConnected(false)

        rt.connection.on('connected', connectHandler)
        rt.connection.on('disconnected', disconnectHandler)

        // enter presence
        channel.presence.enter({ name: 'Guest' }).then(refreshMembers)

        // presence updates
        const onPresence = () => refreshMembers()
        channel.presence.subscribe(onPresence)

        return () => {
            mounted = false
            channel.presence.leave().catch(() => {})
            channel.presence.unsubscribe(onPresence)
            rt.connection.off('connected', connectHandler)
            rt.connection.off('disconnected', disconnectHandler)
        }
    }, [rt, channel, refreshMembers])

    // 발행
    const sendMessage = useCallback(
        async (payload: Omit<ChatMessage, 'id' | 'createdAt'>) => {
            await channel?.publish('chat', {
                id: crypto.randomUUID(),
                createdAt: Date.now(),
                ...payload,
            })
        },
        [channel],
    )

    return {
        connected,
        messages,
        members,
        sendMessage,
    }
}
