'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button, Container } from '@mui/material'

export default function LandingPage() {
    const { status } = useSession()
    const isAuthed = status === 'authenticated'

    return (
        <Container
            maxWidth="md"
            fixed
            className="w-full h-screen flex items-center justify-center text-center"
        >
            <main>
                <h1 className="text-4xl font-bold mb-8">우리플리</h1>

                {isAuthed ? (
                    <>
                        <div className="space-y-4">방 만들기</div>
                        <button type="button" onClick={() => signOut()}>
                            <span>로그아웃</span>
                        </button>
                    </>
                ) : (
                    <div className="gap-4 flex">
                        <Button
                            onClick={() => signIn()}
                            variant="outlined"
                            size="small"
                            color="secondary"
                            type="button"
                        >
                            로그인
                        </Button>
                        <Link href={'/register'}>
                            <Button
                                variant="outlined"
                                size="small"
                                color="secondary"
                                type="button"
                            >
                                회원가입
                            </Button>
                        </Link>
                    </div>
                )}
            </main>
        </Container>
    )
}
