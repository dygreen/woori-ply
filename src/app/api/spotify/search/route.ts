import { NextResponse } from 'next/server'
import { searchTracks } from '@/lib/server/spotify'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const limit = Number(searchParams.get('limit') || 10)

    if (!q) {
        return NextResponse.json({ items: [] }, { status: 200 })
    }

    try {
        const items = await searchTracks(q, limit)
        return NextResponse.json({ items }, { status: 200 })
    } catch (err: any) {
        console.error(err)
        return NextResponse.json(
            { message: 'Spotify search failed' },
            { status: 500 },
        )
    }
}
