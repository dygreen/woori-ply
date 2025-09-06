// app/api/rooms/[roomId]/apply/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/server/db'
import { finalizeVoting } from '@/lib/server/finalizeVoting'

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ roomId: string }> },
) {
    // 로그인 체크 (기존 동작 유지)
    const session = await getServerSession()
    if (!session?.user?.email) {
        return NextResponse.json(
            { message: '로그인이 필요한 서비스입니다.' },
            { status: 401 },
        )
    }

    const { roomId } = await params

    try {
        const database = await db()

        // 기존처럼 FORCE로 마감 트리거 (필요시 타이브레이크 옵션도 추가 가능)
        const result = await finalizeVoting(database, roomId, 'FORCE', {
            allowHostTieBreak: true, // 원래 옵션 없었다면 제거해도 됨 (기능 유지 원칙 우선이면 빼세요)
        })

        // 기존 정책 유지: skip이면 ok: false + 200
        if (result.skipped) {
            return NextResponse.json(
                { ok: false, message: 'SKIPPED' },
                { status: 200 },
            )
        }

        // 성공 응답 스키마 유지
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
