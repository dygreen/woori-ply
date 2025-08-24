import LandingPage from '@/components/landing/LandingPage'

export default async function Home({
    searchParams,
}: {
    searchParams: Promise<{ callbackUrl?: string }>
}) {
    const callbackUrl = (await searchParams)?.callbackUrl

    return <LandingPage callbackUrl={callbackUrl} />
}
