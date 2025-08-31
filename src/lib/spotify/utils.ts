import { SpotifyImage } from '@/types'

export function pickAlbumImage(
    images: SpotifyImage[] | undefined,
    minWidth = 300,
) {
    if (!images?.length) return '/placeholder.png'
    const sorted = images.slice().sort((a, b) => a.width - b.width)
    return (
        sorted.find((i) => i.width >= minWidth) ?? sorted[sorted.length - 1]
    ).url
}

export function formatMs(ms: number) {
    const m = Math.floor(ms / 60000)
    const s = Math.floor((ms % 60000) / 1000)
    return `${m}:${String(s).padStart(2, '0')}`
}
