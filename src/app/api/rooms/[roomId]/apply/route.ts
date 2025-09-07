import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/server/db'
import { finalizeVoting } from '@/lib/server/finalizeVoting'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ roomId: string }> },
) {
    const session = await getServerSession()
    if (!session?.user?.email) {
        return NextResponse.json(
            { message: '로그인이 필요한 서비스입니다.' },
            { status: 401 },
        )
    }

    const { roomId } = await params
    const { reason } = await req.json()

    try {
        const database = await db()
        const result = await finalizeVoting(database, roomId, reason, {
            allowHostTieBreak: true,
        })

        // console.log('[apply] result:', result)
        if (result.skipped) {
            return NextResponse.json(
                { ok: false, message: 'SKIPPED' },
                { status: 200 },
            )
        }

        return NextResponse.json({
            ok: true,
            accepted: result.accepted,
            upCount: result.upCount,
            downCount: result.downCount,
            nextState: result.nextState,
        })
    } catch (e: any) {
        console.error('[apply] finalize failed:', e)
        return NextResponse.json(
            { ok: false, message: e?.message ?? 'FINALIZE_FAILED' },
            { status: 500 },
        )
    }
}
