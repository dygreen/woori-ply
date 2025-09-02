'use client'

import { useCallback, useMemo, useState } from 'react'
import { useCountdown } from '@/hooks/useCountdown'
import { useRoomChannel } from '@/hooks/useRoomChannel'
import s from '@/app/rooms/[roomId]/room.module.scss'
import { useVoting, VoteSummary } from '@/hooks/useVoting'
import { RoomState, RoomVoting, VoteValue } from '@/types'

interface VotingContentProps {
    roomId: string
    roomState: RoomState
    voting?: RoomVoting
}

export default function VotingContent({
    roomId,
    roomState,
    voting,
}: VotingContentProps) {
    const { connected, members, subscribe, unsubscribe } =
        useRoomChannel(roomId)

    const { summary, setSummary } = useVoting(roomId)
    const [myVote, setMyVote] = useState<VoteValue | null>(null)
    const endsAt = voting?.endsAt ?? summary?.endsAt

    // 남은 시간
    const { remainSec, isOver } = useCountdown(endsAt)

    // total(완료 대상자) 추론: 서버 요약 > 실시간 멤버수
    const activeTotal = useMemo(() => {
        if (summary?.total) return summary.total
        return members?.length ?? 0
    }, [members?.length, summary?.total])

    const showApplying =
        roomState === 'APPLYING' || voting?.status === 'APPLYING'
    const votingOpen =
        roomState === 'VOTING' && !isOver && voting?.status === 'OPEN'

    const sendVote = useCallback(
        async (value: VoteValue) => {
            if (!votingOpen) return

            // 매 클릭마다 새로운 멱등 키 생성(투표 변경 허용)
            const idempotencyKey = crypto.randomUUID()

            // 낙관적 업데이트: 내 투표 토글/변경 시 임시 반영
            setMyVote(value)

            try {
                const res = await fetch(`/api/rooms/${roomId}/vote`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ value, idempotencyKey }),
                })
                const json = await res.json()
                if (!res.ok) {
                    throw new Error(json?.error || 'VOTE_FAILED')
                }
                if (json?.summary) setSummary(json.summary as VoteSummary)
            } catch (e) {
                console.error(e)
            }
        },
        [roomId, votingOpen],
    )

    // --- 표시용 유틸 ---
    const up = summary?.up ?? 0
    const down = summary?.down ?? 0
    const completed = summary?.completed ?? 0
    const total = activeTotal || 0

    const disableButtons = !votingOpen || completed >= total

    return (
        <section
            className={s.voting_section}
            aria-busy={showApplying || !connected}
        >
            <header className={s.header}>
                <strong>투표</strong>
                {endsAt ? (
                    <span className={s.timer}>남은 시간 {remainSec}s</span>
                ) : null}
                {showApplying && <span className={s.badge}>집계 중…</span>}
            </header>

            <div className={s.summary}>
                <div className={s.counts}>
                    <span>👍 {up}</span>
                    <span>👎 {down}</span>
                </div>
                <div className={s.progress_wrap}>
                    <div className={s.progress_bar}>
                        <div
                            className={s.progress_fill}
                            style={{
                                width:
                                    total > 0
                                        ? `${(completed / total) * 100}%`
                                        : '0%',
                            }}
                        />
                    </div>
                    <span className={s.progress_label}>
                        {completed}/{total} 투표 완료
                    </span>
                </div>
            </div>

            <div className={s.buttons}>
                <button
                    type="button"
                    className={`${s.btn} ${s.up} ${myVote === 'UP' ? s.active : ''}`}
                    onClick={() => sendVote('UP')}
                    disabled={disableButtons}
                >
                    Boom Up
                </button>
                <button
                    type="button"
                    className={`${s.btn} ${s.down} ${myVote === 'DOWN' ? s.active : ''}`}
                    onClick={() => sendVote('DOWN')}
                    disabled={disableButtons}
                >
                    Boom Down
                </button>
            </div>

            {!connected && <p className={s.hint}>실시간 연결 중…</p>}
            {isOver && roomState === 'VOTING' && (
                <p className={s.hint}>마감 처리 중…</p>
            )}
        </section>
    )
}
