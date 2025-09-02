import { useEffect, useMemo, useState } from 'react'
import { getAblyRealtime } from '@/lib/client/ablyClient'
import Ably from 'ably'

export type VoteSummary = {
    up: number
    down: number
    completed: number
    total: number
    endsAt: number
    round?: number
}

export function useVoting(roomId: string) {
    const rt = useMemo(() => getAblyRealtime(), [])
    const channel = useMemo(
        () => rt.channels.get(`room:${roomId}`),
        [rt, roomId],
    )
    const [summary, setSummary] = useState<VoteSummary | null>(null)

    useEffect(() => {
        if (!channel) return

        const onSummary = (msg: Ably.Message) => {
            const data = msg.data as VoteSummary
            // console.log('VOTE_SUMMARY <<', data)
            setSummary(data)
        }

        channel.subscribe('VOTE_SUMMARY', onSummary)

        // 방에 늦게 들어온 사람을 위해 마지막 집계 1건 불러오기
        ;(async () => {
            try {
                // 1) attach를 기다린 뒤
                await channel.attach()

                // 2) 방에 늦게 들어온 사용자를 위해 마지막 집계 1건 로드
                const page = await channel.history({
                    limit: 1,
                    untilAttach: true,
                })
                const last = page.items.find((m) => m.name === 'VOTE_SUMMARY')
                if (last?.data) setSummary(last.data as VoteSummary)
            } catch (e) {
                console.error(e)
            }
        })()

        return () => {
            channel.unsubscribe('VOTE_SUMMARY', onSummary)
        }
    }, [channel])

    useEffect(() => {
        if (!channel) return
        const onRoomState = (msg: Ably.Message) => {
            const state = msg.data?.state
            const round = msg.data?.voting?.round
            if (state === 'VOTING' && typeof round === 'number') {
                setSummary(null)
            }
        }
        channel.subscribe('ROOM_STATE', onRoomState)
        return () => channel.unsubscribe('ROOM_STATE', onRoomState)
    }, [channel])

    return { summary, setSummary }
}
