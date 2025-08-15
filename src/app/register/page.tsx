import { getServerSession } from 'next-auth'
import { GET } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import SignUpForm from '@/components/forms/SignUpForm'

export default async function Register() {
    const session = await getServerSession(GET)

    if (session) redirect('/')

    return <SignUpForm />
}
