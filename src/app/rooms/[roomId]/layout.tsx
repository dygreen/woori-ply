import React from 'react'
import { notFound } from 'next/navigation'

export default async function RoomLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ roomId: string }>
}) {
    const { roomId } = await params
    const response = await fetch(`${process.env.AUTH_URL}/api/rooms/${roomId}`)

    if (response.status === 404) notFound()
    if (!response.ok) notFound()

    return <>{children}</>
}
