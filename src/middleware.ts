import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
    const isRoom = req.nextUrl.pathname.startsWith('/rooms')
    if (!isRoom) return NextResponse.next()

    const token = await getToken({ req })
    if (!token) {
        const loginUrl = new URL('/', req.url)
        loginUrl.searchParams.set(
            'next',
            req.nextUrl.pathname + req.nextUrl.search,
        )
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

// 이 미들웨어가 동작할 라우트
export const config = {
    matcher: ['/rooms/:path*'],
}
