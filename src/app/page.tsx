'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button, Container } from '@mui/material'
import { useState } from 'react'
import CreateRoom from '@/components/room/CreateRoom'

export default function LandingPage() {
    const { status } = useSession()
    const isAuthed = status === 'authenticated'

    const [openCreateRoomModal, setOpenCreateRoomModal] =
        useState<boolean>(false)

    const handleOpenCreateRoomModal = () => {
        setOpenCreateRoomModal(true)
    }

    const handleCloseCreateRoomModal = () => {
        setOpenCreateRoomModal(false)
    }

    return (
        <>
            <Container maxWidth="md" fixed className="h-full py-4">
                <main className="flex flex-col items-center justify-center text-center h-full">
                    <h1 className="text-5xl font-bold mb-2">우리플리</h1>
                    <p className="text-md font-normal mb-8">
                        실시간 플레이리스트 투표 서비스
                    </p>

                    {isAuthed ? (
                        <div className="gap-4 flex">
                            <Link href={'/'}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    color="inherit"
                                    type="button"
                                    onClick={handleOpenCreateRoomModal}
                                >
                                    방 만들기
                                </Button>
                            </Link>
                            <Button
                                type="button"
                                onClick={() => signOut()}
                                variant="outlined"
                                size="small"
                                color="inherit"
                            >
                                <span>로그아웃</span>
                            </Button>
                        </div>
                    ) : (
                        <div className="gap-4 flex">
                            <Button
                                onClick={() => signIn()}
                                variant="outlined"
                                size="small"
                                color="inherit"
                                type="button"
                            >
                                로그인
                            </Button>
                            <Link href={'/register'}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    color="inherit"
                                    type="button"
                                >
                                    회원가입
                                </Button>
                            </Link>
                        </div>
                    )}
                </main>
            </Container>
            {openCreateRoomModal && (
                <CreateRoom
                    open={openCreateRoomModal}
                    onClose={handleCloseCreateRoomModal}
                />
            )}
        </>
    )
}
