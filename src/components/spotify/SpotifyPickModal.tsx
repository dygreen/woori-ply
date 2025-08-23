'use client'

import { useEffect, useRef, useState } from 'react'
import { SpotifyTrack } from '@/lib/server/spotify'

interface SpotifyPickModalProps {
    open: boolean
    onClose: () => void
    onSelect: (track: SpotifyTrack) => void
}

export default function SpotifyPickModal({
    open,
    onClose,
    onSelect,
}: SpotifyPickModalProps) {
    const [keyword, setKeyword] = useState('')
    const [items, setItems] = useState<SpotifyTrack[]>([])
    const [loading, setLoading] = useState(false)
    const timer = useRef<number | null>(null)

    // 디바운스 검색
    useEffect(() => {
        if (!open) return
        if (timer.current) window.clearTimeout(timer.current)

        if (!keyword) {
            setItems([])
            return
        }
        timer.current = window.setTimeout(async () => {
            setLoading(true)
            try {
                const res = await fetch(
                    `/api/spotify/search?q=${encodeURIComponent(keyword)}&limit=15`,
                )
                const json = await res.json()
                setItems(json.items ?? [])
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }, 350)

        return () => {
            if (timer.current) window.clearTimeout(timer.current)
        }
    }, [keyword, open])

    if (!open) return null

    return (
        <div
            aria-modal
            role="dialog"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-center gap-3">
                    <h2 className="text-lg font-semibold">노래 선택</h2>
                    <button
                        className="ml-auto rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
                        onClick={onClose}
                    >
                        닫기
                    </button>
                </div>

                <input
                    autoFocus
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="곡명, 가수명으로 검색"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2"
                />

                <div className="mt-4 max-h-[420px] overflow-y-auto">
                    {loading && (
                        <div className="py-6 text-center text-sm text-gray-500">
                            검색 중…
                        </div>
                    )}
                    {!loading && items.length === 0 && keyword && (
                        <div className="py-6 text-center text-sm text-gray-500">
                            검색 결과가 없습니다
                        </div>
                    )}
                    <ul className="space-y-2">
                        {items.map((t) => (
                            <li key={t.id}>
                                <button
                                    onClick={() => onSelect(t)}
                                    className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-2 text-left hover:bg-gray-50"
                                >
                                    {/* 앨범 이미지 */}
                                    <div className="h-12 w-12 overflow-hidden rounded-md bg-gray-100">
                                        {t.album.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={t.album.image}
                                                alt={t.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : null}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate font-medium">
                                            {t.name}
                                        </div>
                                        <div className="truncate text-sm text-gray-500">
                                            {t.artists}
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {formatMs(t.durationMs)}
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}

function formatMs(ms: number) {
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${m}:${String(s).padStart(2, '0')}`
}
