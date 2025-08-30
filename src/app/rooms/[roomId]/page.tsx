'use client'

import { notFound, useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useAlert } from '@/components/providers/AlertProvider'
import SpotifyPickModal from '@/components/spotify/SpotifyPickModal'
import { SpotifyTrack } from '@/lib/server/spotify'
import { useRoomChannel } from '@/hooks/useRoomChannel'
import RoomChat from '@/components/chat/RoomChat'
import s from '@/app/rooms/[roomId]/room.module.scss'
import { Room, RoomRole, RoomState } from '@/types'
import RoomStartButton from '@/components/room/RoomStartButton'
import { useRoomEvents } from '@/lib/client/useRoomEvents'

export default function RoomPage() {
    const { roomId } = useParams<{ roomId: string }>()
    const { data: session } = useSession()
    const router = useRouter()
    const { showSuccess, showError } = useAlert()
    const { connected, members, publish, subscribe } = useRoomChannel(roomId)

    const [userRole, setUserRole] = useState<RoomRole | null>(null)
    const [roomDetail, setRoomDetail] = useState<Room | null>(null)

    const [modalOpen, setModalOpen] = useState(false)
    const [selected, setSelected] = useState<SpotifyTrack | null>(null)

    const handleSelect = async (track: SpotifyTrack) => {
        setSelected(track)
        setModalOpen(false)
    }

    const handleModalOpen = () => {
        setModalOpen(true)
    }

    // 방 입장 API
    useEffect(() => {
        if (!session?.user?.email) return
        ;(async () => {
            try {
                const response = await fetch(`/api/rooms/${roomId}/join`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                })
                const data = await response.json()
                if (!response.ok) showError(data.message)
                else {
                    showSuccess('방에 입장하셨습니다.')
                    setUserRole(data.role)
                }
            } catch (e) {
                console.error(e)
            }
        })()
    }, [session?.user?.email, roomId])

    // announce 구독
    useEffect(() => {
        return subscribe('announce', (data) => {
            console.log('announce:', data)
        })
    }, [subscribe])

    // 서버 leave 알림
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

    useRoomEvents(roomId, (event) => {
        if (event.name === 'ROOM_STATE') {
            setRoomDetail(event.data)
        }
    })

    const renderByRoomState = (state: RoomState) => {
        if (!userRole) return <p>로딩중...</p>
        switch (state) {
            case 'IDLE':
                return (
                    <RoomStartButton
                        roomId={roomId}
                        isHost={userRole === 'host'}
                        onModalOpen={handleModalOpen}
                    />
                )
            case 'PICKING':
                return <p>{roomDetail?.pickerName} 님이 곡을 고르는 중...</p>
            default:
                return (
                    <>
                        {/*TODO : 앨범, 컨텐츠, 테이블 영역 컴포넌트화 및 재퍼블리싱*/}
                        <section className={s.album_section}>
                            <div className={s.album_wrapper}>
                                <img
                                    src={
                                        roomDetail?.current?.track?.album?.image
                                    }
                                    alt={
                                        roomDetail?.current?.track?.album?.name
                                    }
                                />
                            </div>
                            <div className={s.detail_wrapper}>컨텐츠</div>
                        </section>
                        <section className={s.table_section}>테이블</section>
                    </>
                )
        }
    }

    if (!roomId) return notFound()

    return (
        <>
            <div className={s.room_layout}>
                <header>우리플리</header>
                <div className={s.room_content}>
                    <main>
                        <section className={s.start_section}>
                            {renderByRoomState(roomDetail?.state ?? 'IDLE')}
                        </section>
                    </main>
                    <aside>
                        <RoomChat roomId={roomId} />
                    </aside>
                </div>
            </div>
            {modalOpen && (
                <SpotifyPickModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    roomId={roomId}
                    roomState={roomDetail?.state}
                />
            )}
        </>
    )
}
