import { getServerSession } from 'next-auth'
import { GET as authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import SignUpForm from '@/components/auth/SignUpForm'

export default async function Register() {
    const session = await getServerSession(authOptions)

    if (session) redirect('/')

    return <SignUpForm />
}
