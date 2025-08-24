import './globals.scss'
import type { Metadata } from 'next'
import SessionProvider from '@/components/providers/SessionProvider'
import React from 'react'
import { AlertProvider } from '@/components/providers/AlertProvider'

export const metadata: Metadata = {
    title: '우리플리',
    description: '실시간 플레이리스트 투표 서비스',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ko">
            <body>
                <SessionProvider>
                    <AlertProvider>{children}</AlertProvider>
                </SessionProvider>
            </body>
        </html>
    )
}
