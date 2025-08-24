import { getServerSession } from 'next-auth'
import { GET_SESSION } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import SignUpForm from '@/components/auth/SignUpForm'

export default async function Register() {
    const session = await getServerSession(GET_SESSION)

    if (session) redirect('/')

    return <SignUpForm />
}
