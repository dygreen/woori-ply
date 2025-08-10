'use client'

import { signIn, signOut, useSession } from 'next-auth/react'

export default function LandingPage() {
    const { status } = useSession()
    const isAuthed = status === 'authenticated'

    return (
        <main className="mx-auto max-w-xl p-6 space-y-6">
            <h1 className="text-2xl font-bold">우리플리</h1>

            {isAuthed ? (
                <>
                    <div className="space-y-4">로그인 상태</div>
                    <button type="button" onClick={() => signOut()}>
                        <span>로그아웃</span>
                    </button>
                </>
            ) : (
                <button
                    onClick={() => signIn()}
                    className="rounded-xl border px-4 py-2"
                >
                    로그인하기
                </button>
            )}
        </main>
    )
}
