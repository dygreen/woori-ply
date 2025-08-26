'use client'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import { useRoomChat } from '@/hooks/useRoomChat'
import { Button, TextField } from '@mui/material'
import { ChatMessage } from '@/types'

export default function RoomChat({ roomId }: { roomId: string }) {
    const { data: session } = useSession()
    const userId = session?.user?.email ?? 'guest@anon'
    const userName = session?.user?.name ?? 'Guest'
    const { connected, messages, members, sendMessage } = useRoomChat({
        roomId,
    })

    const [text, setText] = useState('')
    const listRef = useRef<HTMLDivElement>(null)

    const handleSend = async () => {
        const trimmed = text.trim()
        if (!trimmed) return
        await sendMessage({
            roomId,
            userId,
            userName,
            text: trimmed,
            type: 'text',
        })
        setText('')
    }

    useEffect(() => {
        listRef.current?.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: 'smooth',
        })
    }, [messages.length])

    return (
        <div className="flex flex-col h-full">
            <div className="text-sm text-gray-500 mb-2">
                {connected ? '● 온라인' : '○ 오프라인'} · 접속자{' '}
                {members.length}명
            </div>

            <div
                ref={listRef}
                className="flex-1 overflow-y-auto rounded-lg border p-2 space-y-2"
            >
                {messages.map((m: ChatMessage) => {
                    const mine = m.userId === userId
                    return (
                        <div
                            key={m.id}
                            className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm
                ${mine ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                            >
                                {!mine && (
                                    <div className="font-medium text-xs mb-1">
                                        {m.userName ?? m.userId}
                                    </div>
                                )}
                                <div>{m.text}</div>
                                <div className="text-[10px] opacity-70 mt-1">
                                    {new Date(m.createdAt).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="mt-2 flex gap-2">
                <TextField
                    fullWidth
                    size="small"
                    placeholder="메시지를 입력하세요"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSend()
                        }
                    }}
                />
                <Button variant="contained" onClick={handleSend}>
                    보내기
                </Button>
            </div>
        </div>
    )
}
