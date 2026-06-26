export function AuthShell({ eyebrow, title, subtitle, children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.32),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.16),_transparent_24%),linear-gradient(180deg,_#dff0ff_0%,_#eef7ff_48%,_#e4effa_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.36)_0%,transparent_38%,rgba(255,255,255,0.18)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_20%_40%,rgba(255,255,255,0.8),transparent_32%),radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.65),transparent_28%)] opacity-60" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full">
          <section className="flex items-center justify-center">
            <div className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/70 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-700">{eyebrow}</p>
              <div className="mt-3">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">{subtitle}</p>
              </div>
              <div className="mt-6">{children}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
