export function AuthShell({ eyebrow, title, subtitle, children }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-tr from-slate-100 via-blue-50/30 to-blue-50/60 font-sans">
      
      {/* Dynamic light grid accent */}
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.4)_0%,transparent_38%,rgba(255,255,255,0.2)_100%)] pointer-events-none" />

      <div className="relative w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-350">
        <section className="flex items-center justify-center">
          <div className="w-full rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">{eyebrow}</p>
            <div className="mt-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{subtitle}</p>
            </div>
            <div className="mt-6">{children}</div>
          </div>
        </section>
      </div>
    </div>
  )
}
