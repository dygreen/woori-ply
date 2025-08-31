'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useCountdown } from '@/hooks/useCountdown'
import { useRoomChannel } from '@/hooks/useRoomChannel'
import s from '@/app/rooms/[roomId]/room.module.scss'

type VoteValue = 'UP' | 'DOWN'
type VoteSummary = {
    up: number
    down: number
    completed: number
    total: number
    endsAt: number
}

/** 서버에서 내려주는 Room의 voting 스냅샷(있으면) */
type VotingMeta = {
    round: number
    trackId: string
    pickerId: string
    endsAt: number
    status: 'OPEN' | 'APPLYING' | 'APPLIED'
}

interface VotingContentProps {
    roomId: string
    /** 서버에서 받은 Room snapshot (state === 'VOTING'일 때만 필요 값 참조) */
    roomState: 'IDLE' | 'PICKING' | 'VOTING' | 'APPLYING' | 'FINISHED'
    voting?: VotingMeta | null
    /** (선택) 페이지 최초 로딩 시점의 요약 값이 있으면 전달 */
    initialSummary?: VoteSummary
}

/**
 * Boom Up/Down + 카운트다운 + 요약 표시 + 실시간 반영
 */
export default function VotingContent({
    roomId,
    roomState,
    voting,
    initialSummary,
}: VotingContentProps) {
    const { data: session } = useSession()
    const myUserId = String(session?.user?.email ?? '')

    // 실시간 채널
    const { connected, members, subscribe, unsubscribe } =
        useRoomChannel(roomId)

    // 요약/내 투표 상태
    const [summary, setSummary] = useState<VoteSummary | null>(
        initialSummary ?? null,
    )
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

    // --- 실시간 구독: 요약/마감 ---
    // VotingContent.tsx (일부 발췌)
    useEffect(() => {
        // 최신 값 사용을 위해 ref로 잡아두면 불필요한 재구독 방지 가능(선택)
        const totalRef = { current: activeTotal }
        const endsAtRef = { current: endsAt ?? 0 }

        const onSummary = (d: any) => {
            // ⛔️ 기존: const d = msg?.data  (잘못된 접근)
            if (!d) return
            setSummary((prev) => ({
                up: d.up ?? prev?.up ?? 0,
                down: d.down ?? prev?.down ?? 0,
                completed: d.completed ?? prev?.completed ?? 0,
                total: d.total ?? prev?.total ?? totalRef.current,
                endsAt: d.endsAt ?? prev?.endsAt ?? endsAtRef.current,
            }))
        }

        const onApplied = (_d: any) => {
            // 필요 시 표시만 업데이트. 최종 state/playlist는 상위에서 리프레시됨
        }

        const onRoomState = (d: any) => {
            if (d?.state && d.state !== 'VOTING') {
                // 투표 종료 시 로컬 UI 제어(버튼 비활성 등) 필요하면 처리
            }
        }

        // 👉 subscribe가 반환하는 "해제 함수"를 쓰면 안전합니다.
        const offSummary = subscribe('VOTE_SUMMARY', onSummary)
        const offApplied = subscribe('APPLIED', onApplied)
        const offRoomState = subscribe('ROOM_STATE', onRoomState)

        return () => {
            offSummary()
            offApplied()
            offRoomState()
        }
        // subscribe만 의존하도록 두고, 내부에서 ref로 최신 값 참조하면 불필요한 재구독을 줄일 수 있습니다.
    }, [subscribe])

    useEffect(() => {
        const off = subscribe('VOTE_SUMMARY', (d) => {
            console.log('[CLIENT] got VOTE_SUMMARY', d)
            setSummary((prev) => ({ ...prev, ...d }))
        })
        return off
    }, [subscribe])

    // --- API 호출 ---
    const sendVote = useCallback(
        async (value: VoteValue) => {
            if (!votingOpen) return

            // 매 클릭마다 새로운 멱등 키 생성(투표 변경 허용)
            const idempotencyKey = crypto.randomUUID()

            // 낙관적 업데이트: 내 투표 토글/변경 시 임시 반영
            setMyVote(value)
            setSummary((prev) => {
                if (!prev) return prev
                // 이전에 내가 반영한 값이 뭔지 모르면 보수적으로 그대로 두고,
                // 서버 요약 수신(VOTE_SUMMARY 또는 응답)으로 동기화함.
                return { ...prev }
            })

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
                // 실패 시 롤백(선택)
                // setMyVote(null)
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
