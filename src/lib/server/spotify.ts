let cachedToken: { accessToken: string; expiresAt: number } | null = null

async function getAppToken(): Promise<string> {
    const now = Date.now()
    if (cachedToken && cachedToken.expiresAt > now + 5_000) {
        return cachedToken.accessToken
    }
    const credentials = Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
    ).toString('base64')

    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ grant_type: 'client_credentials' }),
        cache: 'no-store',
    })

    if (!res.ok) {
        const t = await res.text()
        throw new Error(`Failed to get Spotify token: ${res.status} ${t}`)
    }
    const json = (await res.json()) as {
        access_token: string
        expires_in: number
    }
    cachedToken = {
        accessToken: json.access_token,
        expiresAt: Date.now() + (json.expires_in - 10) * 1000,
    }
    return cachedToken.accessToken
}

export type SpotifyTrack = {
    id: string
    name: string
    artists: string
    album: { id: string; name: string; image: string | null }
    durationMs: number
    previewUrl: string | null
}

export async function searchTracks(
    q: string,
    limit = 10,
): Promise<SpotifyTrack[]> {
    const token = await getAppToken()
    const url = new URL('https://api.spotify.com/v1/search')
    url.searchParams.set('q', q)
    url.searchParams.set('type', 'track')
    url.searchParams.set('limit', String(limit))

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
    })

    if (!res.ok) {
        const t = await res.text()
        throw new Error(`Spotify search failed: ${res.status} ${t}`)
    }

    const json = (await res.json()) as any
    const items = (json?.tracks?.items ?? []) as any[]
    return items.map((it) => ({
        id: it.id,
        name: it.name,
        artists: it.artists?.map((a: any) => a.name).join(', ') ?? '',
        album: {
            id: it.album?.id ?? '',
            name: it.album?.name ?? '',
            image: it.album?.images?.[it.album.images.length - 1]?.url ?? null, // 가장 작은 이미지
        },
        durationMs: it.duration_ms ?? 0,
        previewUrl: it.preview_url ?? null,
    }))
}
