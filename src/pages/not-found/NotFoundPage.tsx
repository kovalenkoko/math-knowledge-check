import { Link } from 'react-router-dom'

import { routes } from '@/shared/config/routes'

export function NotFoundPage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl place-content-center gap-6 px-4 py-10 text-center md:py-16">
      <p className="mx-auto w-fit rounded-full bg-blue-100 px-3 py-2 text-sm font-bold tracking-[0.08em] text-blue-700 uppercase">
        404
      </p>
      <h1 className="text-[clamp(2.5rem,8vw,5rem)] leading-[0.95] font-bold tracking-[-0.06em] text-slate-950">
        Page not found
      </h1>
      <p className="max-w-2xl text-lg text-slate-600">
        The page you requested does not exist or has been moved.
      </p>
      <Link
        className="justify-self-center font-bold text-blue-700 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-blue-100"
        to={routes.home}
      >
        Back to home
      </Link>
    </main>
  )
}
