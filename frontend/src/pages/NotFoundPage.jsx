import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-[2rem] border border-white/70 bg-white/75 p-8 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-700">Not found</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">The page could not be located.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Use the sign-in page to continue to the LIS authentication module.</p>
        <Link to="/login" className="mt-6 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20">
          Go to Sign In
        </Link>
      </div>
    </div>
  )
}