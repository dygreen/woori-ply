'use client'

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
