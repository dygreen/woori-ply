'use client'

import { useAlert } from '@/components/providers/AlertProvider'

interface RoomStartButtonProps {
    roomId: string
    isHost: boolean
    onModalOpen: () => void
}

export default function RoomStartButton({
    roomId,
    isHost,
    onModalOpen,
}: RoomStartButtonProps) {
    const { showError } = useAlert()

    const handleStart = async () => {
        try {
            const response = await fetch(`/api/rooms/${roomId}/start`, {
                method: 'POST',
            })
            const data = await response.json()

            if (response.ok) {
                onModalOpen()
            } else {
                showError(data.message)
            }
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <>
            {isHost ? (
                <button onClick={handleStart}>시작!</button>
            ) : (
                <p>방장이 준비되면 시작됩니다.</p>
            )}
        </>
    )
}
