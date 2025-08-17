import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/server/db'
import { SignupSchema, SignUpInput } from '@/lib/validation/auth'
import { hashPassword } from '@/lib/crypto/hash'
import { User } from '@/types'

export async function POST(req: NextRequest) {
    try {
        const json = await req.json()

        // 1) 입력 검증
        const { name, email, password } = (await SignupSchema.validate(json, {
            abortEarly: false, // 모든 에러 수집
            stripUnknown: true,
        })) as SignUpInput

        const database = await db()
        const users = database.collection<User>('user_cred')

        // 2) 이메일 유니크 인덱스 보장(최초 1회)
        await users.createIndex({ email: 1 }, { unique: true })

        // 3) 이미 존재하는지 체크
        const existing = await users.findOne({ email })
        if (existing) {
            return NextResponse.json(
                { message: '이미 사용 중인 이메일입니다.' },
                { status: 409 },
            )
        }

        // 4) 비밀번호 해시
        const passwordHash = await hashPassword(password)

        // 5) 저장
        const now = new Date()
        const doc = {
            name,
            email,
            password: passwordHash,
            createdAt: now,
            updatedAt: now,
        }

        await users.insertOne(doc)

        return NextResponse.json(
            {
                message: '회원가입 되었습니다.',
            },
            { status: 201 },
        )
    } catch (err: any) {
        // MongoDB 중복키(유니크 인덱스) 충돌
        if (err?.code === 11000) {
            return NextResponse.json(
                { message: '이미 사용 중인 이메일입니다.' },
                { status: 409 },
            )
        }

        // Yup 검증 에러
        if (err?.name === 'ValidationError') {
            const details = err.inner?.map((e: any) => ({
                path: e.path,
                message: e.message,
            }))
            return NextResponse.json(
                { message: '입력값이 올바르지 않습니다.', details },
                { status: 400 },
            )
        }

        // 기타 서버 에러
        console.error(err)
        return NextResponse.json(
            { message: '회원가입 처리 중 오류가 발생했습니다.' },
            { status: 500 },
        )
    }
}
