import ClientLoginPage from './ClientLoginPage'
import { headers } from 'next/headers'
import Navigation from '@/components/Navigation'

export default async function LoginPage(props: {
  searchParams: Promise<{ message?: string, next?: string }>
}) {
  const searchParams = await props.searchParams
  const headersList = await headers()
  const referer = headersList.get('referer') || undefined

  return (
    <>
      <Navigation />
      <ClientLoginPage searchParams={searchParams} referer={referer} />
    </>
  )
}
