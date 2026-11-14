import ClientLoginPage from './ClientLoginPage'
import { headers } from 'next/headers'

export default async function LoginPage(props: {
  searchParams: Promise<{ message?: string, next?: string }>
}) {
  const searchParams = await props.searchParams
  const headersList = await headers()
  const referer = headersList.get('referer') || undefined

  return (
    <>
            <ClientLoginPage searchParams={searchParams} referer={referer} />
    </>
  )
}
