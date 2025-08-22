import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
} from '@mui/material'
import { useState } from 'react'
import { useAlert } from '@/components/providers/AlertProvider'
import { useRouter } from 'next/navigation'

interface CreateRoomProps {
    open: boolean
    onClose: () => void
}

export default function CreateRoom({ open, onClose }: CreateRoomProps) {
    const [createdUrl, setCreatedUrl] = useState<string | null>(null)
    const [roomId, setRoomId] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [maxSongs, setMaxSongs] = useState<number | null>(null)

    const { showSuccess, showError } = useAlert()
    const router = useRouter()

    const handleCreateRoom = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ maxSongs }),
            })
            const data = await response.json()

            if (response.status === 201) {
                setCreatedUrl(data.url)
                setRoomId(data.roomId)
                showSuccess('방 생성이 완료되었습니다.')
            } else if (response.status === 401) {
                showError(data.message)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const copyUrl = async () => {
        if (!createdUrl) return
        await navigator.clipboard.writeText(createdUrl)
        showSuccess('URL이 복사되었습니다!', {
            autoHideDuration: 3000,
        })
    }

    const navigateToRoom = async () => {
        router.push(`/rooms/${roomId}`)
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>방 만들기</DialogTitle>
            <DialogContent>
                <FormControl>
                    <FormLabel>노래 개수</FormLabel>
                    <RadioGroup
                        defaultValue="outlined"
                        onChange={(e) => {
                            setMaxSongs(Number(e.target.value))
                        }}
                        className="flex flex-row! gap-2"
                    >
                        <FormControlLabel
                            value={10}
                            control={<Radio />}
                            label="10"
                        />
                        <FormControlLabel
                            value={20}
                            control={<Radio />}
                            label="20"
                        />
                        <FormControlLabel
                            value={30}
                            control={<Radio />}
                            label="30"
                        />
                    </RadioGroup>
                </FormControl>
                {createdUrl && (
                    <div style={{ marginTop: 16 }}>
                        <div
                            style={{
                                fontSize: 12,
                                opacity: 0.8,
                                marginBottom: 4,
                            }}
                        >
                            방 접속 URL
                        </div>
                        <code
                            className="text-sky-600 underline cursor-pointer"
                            style={{
                                display: 'block',
                                wordBreak: 'break-all',
                            }}
                            onClick={copyUrl}
                        >
                            {createdUrl}
                        </code>
                        <Button
                            onClick={navigateToRoom}
                            sx={{ mt: 2 }}
                            variant="outlined"
                            size="small"
                            color="inherit"
                            type="button"
                        >
                            방으로 이동
                        </Button>
                    </div>
                )}
            </DialogContent>
            <DialogActions>
                {!createdUrl ? (
                    <Button onClick={handleCreateRoom} disabled={loading}>
                        생성
                    </Button>
                ) : (
                    <Button onClick={onClose}>닫기</Button>
                )}
            </DialogActions>
        </Dialog>
    )
}
