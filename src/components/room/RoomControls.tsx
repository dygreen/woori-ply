'use client'

interface RoomControlsProps {
    roomId: string
    isHost: boolean
    onModalOpen: () => void
}

export default function RoomControls({
    roomId,
    isHost,
    onModalOpen,
}: RoomControlsProps) {
    const handleStart = async () => {
        const response = await fetch(`/api/rooms/${roomId}/start`, {
            method: 'POST',
        })
        if (response.ok) {
            onModalOpen()
        } else {
            console.error('Room start failed')
        }
    }

    if (!isHost) return null

    return <button onClick={handleStart}>시작!</button>
}
