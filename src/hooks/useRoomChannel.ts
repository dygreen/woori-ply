'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getAblyRealtime } from '@/lib/client/ablyClient'

type PresenceMember = { clientId: string; name?: string; joinedAt?: number }

export function useRoomChannel(roomId: string) {
    const rt = useMemo(() => getAblyRealtime(), [])
    const channel = useMemo(
        () => rt.channels.get(`room:${roomId}`),
        [rt, roomId],
    )

    const [connected, setConnected] = useState(false)
    const [members, setMembers] = useState<PresenceMember[]>([])
    const mountedRef = useRef(true)

    // 연결 상태
    useEffect(() => {
        mountedRef.current = true
        const onConnected = () => mountedRef.current && setConnected(true)
        const onDisconnected = () => mountedRef.current && setConnected(false)
        rt.connection.on('connected', onConnected)
        rt.connection.on('disconnected', onDisconnected)
        rt.connect()
        return () => {
            mountedRef.current = false
            rt.connection.off('connected', onConnected)
            rt.connection.off('disconnected', onDisconnected)
        }
    }, [rt])

    // presence 입장 + 목록 유지
    const refreshMembers = useCallback(async () => {
        const list = await channel.presence.get()
        setMembers(
            list.map((p) => ({
                clientId: String(p.clientId),
                name: p.data?.name,
                joinedAt: p.timestamp,
            })),
        )
    }, [channel])

    useEffect(() => {
        let mounted = true
        ;(async () => {
            try {
                await channel.presence.enter({ joinedAt: Date.now() })
                if (!mounted) return
                await refreshMembers()
            } catch {}
        })()

        const onPresence = () => refreshMembers()
        channel.presence.subscribe('enter', onPresence)
        channel.presence.subscribe('leave', onPresence)
        channel.presence.subscribe('update', onPresence)

        return () => {
            mounted = false
            channel.presence.leave().catch(() => {})
            channel.presence.unsubscribe(onPresence)
        }
    }, [channel, refreshMembers])

    // 임의 이벤트 구독 도우미 (예: 'announce' 등)
    const subscribe = useCallback(
        (name: string, handler: (data: any) => void) => {
            const listener = (msg: any) => handler(msg.data)
            channel.subscribe(name, listener)
            return () => channel.unsubscribe(name, listener)
        },
        [channel],
    )

    // 발행
    const publish = useCallback(
        async (name: string, data: any) => {
            await channel.publish(name, data)
        },
        [channel],
    )

    return { connected, members, publish, subscribe }
}
