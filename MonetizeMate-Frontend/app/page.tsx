import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Home() {
  const cookieStore = await cookies()
  const session = cookieStore.get(process.env.JWT_COOKIE_NAME || 'session')?.value

  redirect(session ? '/dashboard' : '/login')
}
