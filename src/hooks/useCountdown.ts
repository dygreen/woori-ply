'use client'

import { useEffect, useState } from 'react'

/** endsAt(ms)까지 남은 ms/초를 내려주는 훅 */
export function useCountdown(endsAt?: number) {
    const [now, setNow] = useState<number>(() => Date.now())

    useEffect(() => {
        if (!endsAt) return
        const t = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(t)
    }, [endsAt])

    const remainMs = Math.max(0, (endsAt ?? 0) - now)
    const remainSec = Math.ceil(remainMs / 1000)

    return { remainMs, remainSec, isOver: remainMs <= 0 }
}
