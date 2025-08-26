'use client'

import { notFound, useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useAlert } from '@/components/providers/AlertProvider'
import SpotifyPickModal from '@/components/spotify/SpotifyPickModal'
import { SpotifyTrack } from '@/lib/server/spotify'
import { Button } from '@mui/material'
import { useRoomChannel } from '@/hooks/useRoomChannel'

export default function RoomPage() {
    const { roomId } = useParams<{ roomId: string }>()
    const { data: session } = useSession()
    const router = useRouter()
    const { showSuccess, showError } = useAlert()

    const { connected, members, publish, subscribe } = useRoomChannel(roomId)

    const [modalOpen, setModalOpen] = useState(false)
    const [selected, setSelected] = useState<SpotifyTrack | null>(null)

    // 방 입장 API
    useEffect(() => {
        if (!connected || !session?.user?.email) return
        ;(async () => {
            try {
                const response = await fetch(`/api/rooms/${roomId}/join`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                })
                const data = await response.json()
                if (!response.ok) showError(data.message)
                else showSuccess('방에 입장하셨습니다.')
            } catch (e) {
                console.error(e)
            }
        })()
    }, [connected, session?.user?.email, roomId])

    // announce 구독 (예시)
    useEffect(() => {
        return subscribe('announce', (data) => {
            console.log('announce:', data)
        })
    }, [subscribe])

    // 서버 leave 알림(현 코드 유지)
    useEffect(() => {
        if (!roomId) return
        const sendLeave = () => {
            try {
                const ok = navigator.sendBeacon?.(
                    `/api/rooms/${roomId}/leave`,
                    new Blob([JSON.stringify({})], {
                        type: 'application/json',
                    }),
                )
                if (!ok) {
                    fetch(`/api/rooms/${roomId}/leave`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({}),
                        keepalive: true,
                        cache: 'no-store',
                    }).catch(() => {})
                }
            } catch {
                fetch(`/api/rooms/${roomId}/leave`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}),
                    keepalive: true,
                    cache: 'no-store',
                }).catch(() => {})
            }
        }
        window.addEventListener('pagehide', sendLeave)
        window.addEventListener('beforeunload', sendLeave)
        return () => {
            window.removeEventListener('pagehide', sendLeave)
            window.removeEventListener('beforeunload', sendLeave)
        }
    }, [roomId])

    // 방 종료 이벤트 처리
    useEffect(() => {
        return subscribe('roomClosed', () => {
            showError('방이 종료되었습니다.')
            router.replace('/')
        })
    }, [subscribe, router, showError])

    const handleSelect = async (track: SpotifyTrack) => {
        setSelected(track)
        setModalOpen(false)
    }

    if (!roomId) return notFound()

    return (
        <main style={{ padding: 24 }}>
            <h1>Room: {roomId}</h1>
            <p>연결 상태: {connected ? 'connected' : 'connecting...'}</p>
            <h3>참여자({members.length})</h3>
            <ul>
                {members.map((m) => (
                    <li key={m.clientId}>{m.clientId}</li>
                ))}
            </ul>

            <button
                onClick={() => publish('announce', { text: 'Hello room!' })}
                disabled={!connected}
            >
                방에 알림 보내기
            </button>

            <Button onClick={() => setModalOpen(true)}>모달 오픈 테스트</Button>
            <SpotifyPickModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSelect={handleSelect}
            />
        </main>
    )
}
