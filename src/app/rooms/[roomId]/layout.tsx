import React from 'react'
import { notFound } from 'next/navigation'

export default async function RoomLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: { roomId: string }
}) {
    const response = await fetch(
        `${process.env.AUTH_URL}/api/rooms/${params.roomId}`,
    )
    if (response.status === 404) notFound()
    if (!response.ok) notFound()

    return <>{children}</>
}
