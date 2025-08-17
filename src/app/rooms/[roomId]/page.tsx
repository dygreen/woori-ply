'use client'

import { notFound, useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { createAblyRealtime } from '@/lib/server/ablyClient'

export default function RoomPage() {
    const { roomId } = useParams<{ roomId: string }>()
    const [members, setMembers] = useState<string[]>([])
    const [connected, setConnected] = useState<boolean>(false)

    const rt = useMemo(() => createAblyRealtime(), [])
    const channel = useMemo(
        () => rt.channels.get(`room:${roomId}`),
        [rt, roomId],
    )

    useEffect(() => {
        let mounted = true

        // 연결
        rt.connection.once('connected', async () => {
            if (!mounted) return
            setConnected(true)

            // presence 입장
            await channel.presence.enter({ joinedAt: Date.now() })

            // 현재 멤버 로드
            const presence = await channel.presence.get()
            setMembers(presence.map((p) => String(p.clientId)))
        })

        // presence 업데이트 구독
        const onEnter = () =>
            channel.presence
                .get()
                .then((list) => setMembers(list.map((p) => String(p.clientId))))
        const onLeave = onEnter
        channel.presence.subscribe('enter', onEnter)
        channel.presence.subscribe('leave', onLeave)

        // 메시지 샘플 구독
        channel.subscribe('announce', (msg) => {
            console.log('announce:', msg.data)
        })

        rt.connect()

        return () => {
            mounted = false
            channel.presence.leave().catch(() => {})
            channel.presence.unsubscribe()
            channel.unsubscribe()
            rt.close()
        }
    }, [channel, rt])

    if (!roomId) return notFound()

    return (
        <main style={{ padding: 24 }}>
            <h1>Room: {roomId}</h1>
            <p>연결 상태: {connected ? 'connected' : 'connecting...'}</p>
            <h3>참여자({members.length})</h3>
            <ul>
                {members.map((m) => (
                    <li key={m}>{m}</li>
                ))}
            </ul>
            <button
                onClick={() =>
                    channel.publish('announce', { text: 'Hello room!' })
                }
                disabled={!connected}
            >
                방에 알림 보내기
            </button>
        </main>
    )
}
