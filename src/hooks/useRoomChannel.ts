'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getAblyRealtime } from '@/lib/client/ablyClient'

type PresenceMember = { clientId: string; name?: string; joinedAt?: number }

export function useRoomChannel(roomId: string) {
    const rt = useMemo(() => getAblyRealtime(), [])
    const channel = useMemo(
        () => rt.channels.get(`room:${roomId}`, { params: { rewind: '1' } }),
        [rt, roomId],
    )

    const [connected, setConnected] = useState(false)
    const [members, setMembers] = useState<PresenceMember[]>([])
    const mountedRef = useRef(true)

    // 이벤트 리스너 매핑: eventName -> (originalHandler -> wrappedListener)
    const listenersRef = useRef<
        Map<string, Map<(data: any) => void, (msg: any) => void>>
    >(new Map())

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
            channel.presence.unsubscribe('enter', onPresence)
            channel.presence.unsubscribe('leave', onPresence)
            channel.presence.unsubscribe('update', onPresence)
        }
    }, [channel, refreshMembers])

    // 임의 이벤트 구독 (msg.data만 전달)
    const subscribe = useCallback(
        (name: string, handler: (data: any) => void) => {
            const wrapped = (msg: any) => handler(msg?.data)
            // 매핑 저장
            if (!listenersRef.current.has(name)) {
                listenersRef.current.set(name, new Map())
            }
            listenersRef.current.get(name)!.set(handler, wrapped)

            channel.subscribe(name, wrapped)

            // 즉시 해제용 함수 반환
            return () => {
                channel.unsubscribe(name, wrapped)
                const map = listenersRef.current.get(name)
                map?.delete(handler)
                if (map && map.size === 0) listenersRef.current.delete(name)
            }
        },
        [channel],
    )

    // 개별 해제 (subscribe에서 넘겼던 같은 handler 참조 필요)
    const unsubscribe = useCallback(
        (name: string, handler: (data: any) => void) => {
            const map = listenersRef.current.get(name)
            const wrapped = map?.get(handler)
            if (wrapped) {
                channel.unsubscribe(name, wrapped)
                map!.delete(handler)
                if (map!.size === 0) listenersRef.current.delete(name)
            }
        },
        [channel],
    )

    // 모든 등록 이벤트 정리(채널 변경/언마운트 시)
    useEffect(() => {
        return () => {
            listenersRef.current.forEach((map, eventName) => {
                map.forEach((wrapped) =>
                    channel.unsubscribe(eventName, wrapped),
                )
            })
            listenersRef.current.clear()
        }
    }, [channel])

    // 발행
    const publish = useCallback(
        async (name: string, data: any) => {
            await channel.publish(name, data)
        },
        [channel],
    )

    return { connected, members, publish, subscribe, unsubscribe }
}
