// src/hooks/useVoting.ts
import { useEffect, useRef, useState } from 'react'
import { useRoomChannel } from '@/hooks/useRoomChannel'

export type VoteSummary = {
    up: number
    down: number
    completed: number
    total: number
    endsAt: number
    round: number
}

export function useVoting(roomId: string) {
    const { subscribe } = useRoomChannel(roomId)
    const [summary, setSummary] = useState<VoteSummary | null>(null)
    const lastRoundRef = useRef<number | null>(null)

    useEffect(() => {
        // 서버 /vote/route.ts 가 publishRoomEvent(..., 'VOTE_SUMMARY', { round, ...summary })
        // 로 쏘는 걸 그대로 받음
        const offSummary = subscribe('VOTE_SUMMARY', (data: VoteSummary) => {
            setSummary(data)
            lastRoundRef.current = data.round
        })

        // (선택) 라운드 전환 시 이전 집계 잔상 제거
        const offState = subscribe('ROOM_STATE', (data: any) => {
            const state = data?.state
            const round = data?.voting?.round
            if (state === 'VOTING' && typeof round === 'number') {
                if (lastRoundRef.current !== round) {
                    setSummary(null)
                    lastRoundRef.current = round
                }
            }
        })

        return () => {
            offSummary?.()
            offState?.()
        }
    }, [roomId, subscribe])

    return { summary }
}
