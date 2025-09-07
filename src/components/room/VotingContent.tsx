'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCountdown } from '@/hooks/useCountdown'
import { useRoomChannel } from '@/hooks/useRoomChannel'
import s from '@/app/rooms/[roomId]/room.module.scss'
import { useVoting, VoteSummary } from '@/hooks/useVoting'
import { RoomState, RoomVoting, VoteValue, VotingReason } from '@/types'

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

    const finalizeOnceRef = useRef(false)
    const finalizeOnce = useCallback(
        async (reason: VotingReason) => {
            if (finalizeOnceRef.current) return
            finalizeOnceRef.current = true
            try {
                await fetch(`/api/rooms/${roomId}/apply`, {
                    method: 'POST',
                    body: JSON.stringify({ reason }),
                })
            } catch (e) {
                // 실패해도 서버 락으로 재시도 안전
                console.error('[auto-finalize failed]', reason, e)
                finalizeOnceRef.current = false // 원하면 재시도 허용
            }
        },
        [roomId],
    )

    // A) 타이머 만료 감지 → 마감
    useEffect(() => {
        if (roomState !== 'VOTING') return
        if (isOver) finalizeOnce('ENDS_AT')
    }, [roomState, isOver, finalizeOnce])

    // B) 실시간 합계로 전원 완료 감지 → 마감
    useEffect(() => {
        console.log('roomState: ', roomState)
        if (roomState !== 'VOTING') return

        // 요약이 없으면 동작하지 않음 (멤버수 추론 X)
        if (summary?.total == null) return

        const completed = summary.completed ?? 0
        const total = summary.total

        if (total > 0 && completed >= total) {
            console.log('roomState2: ', roomState)
            finalizeOnce('ALL_VOTED')
        }
    }, [roomState, summary?.completed, summary?.total, finalizeOnce])

    // (선택) C) 서버가 쏘는 실시간 요약 이벤트를 직접 구독하고 summary를 갱신
    useEffect(() => {
        return subscribe('VOTE_SUMMARY', (msg: any) => {
            // msg가 바로 summary일 수도, {name,data}일 수도 있음
            const data = msg?.data ?? msg
            if (!data) return
            setSummary(data as VoteSummary)
        })
    }, [subscribe, setSummary])

    // 라운드 기준이 있다면 voting?.round, 없다면 endsAt 변화로 리셋
    useEffect(() => {
        finalizeOnceRef.current = false
    }, [voting?.round, endsAt])

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
