'use client'

import { notFound, useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useAlert } from '@/components/providers/AlertProvider'
import SpotifyPickModal from '@/components/spotify/SpotifyPickModal'
import { useRoomChannel } from '@/hooks/useRoomChannel'
import RoomChat from '@/components/chat/RoomChat'
import s from '@/app/rooms/[roomId]/room.module.scss'
import { Room, RoomRole, RoomState, SpotifyTrack } from '@/types'
import RoomStartButton from '@/components/room/RoomStartButton'
import { useRoomEvents } from '@/lib/client/useRoomEvents'
import SelectedAlbum from '@/components/room/SelectedAlbum'
import VotedPlyTable from '@/components/room/VotedPlyTable'
import VotingContent from '@/components/room/VotingContent'

export default function RoomPage() {
    const { roomId } = useParams<{ roomId: string }>()
    const { data: session } = useSession()
    const router = useRouter()
    const { showSuccess, showError } = useAlert()
    const { connected, members, publish, subscribe } = useRoomChannel(roomId)

    const [userRole, setUserRole] = useState<RoomRole | null>(null)
    const [roomState, setRoomState] = useState<RoomState>('IDLE')
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
                    setRoomState(data.state)
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
        // console.log('event : ', event)
        if (event.name === 'ROOM_STATE') {
            setRoomDetail(event.data)
        }
    })

    const renderByRoomState = (state: RoomState) => {
        if (!userRole)
            return (
                <section className={s.start_section}>
                    <p>로딩중...</p>
                </section>
            )
        switch (state) {
            case 'IDLE':
                return (
                    <section className={s.start_section}>
                        <RoomStartButton
                            roomId={roomId}
                            isHost={userRole === 'HOST'}
                            onModalOpen={handleModalOpen}
                        />
                    </section>
                )
            case 'PICKING':
                return (
                    <section className={s.start_section}>
                        <p>{roomDetail?.pickerName} 님이 곡을 고르는 중...</p>
                    </section>
                )
            default:
                return (
                    <>
                        <section className={s.album_section}>
                            <SelectedAlbum roomDetail={roomDetail} />
                            {state === 'VOTING' && (
                                <VotingContent
                                    roomId={roomId}
                                    roomState="VOTING"
                                    voting={roomDetail?.voting}
                                />
                            )}
                        </section>
                        {/*TODO: VotedPlyTable 추가*/}
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
                        {renderByRoomState(roomDetail?.state ?? roomState)}
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
