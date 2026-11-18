import React from 'react'
import Image from 'next/image'
import { CircleAlert, CircleCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Moldura das telas de acesso (equipe e administrador).
 * O painel azul tem a borda curva com aro rosa, como a lente da lupa do logo;
 * os anéis em volta do logo aparecem uma única vez ao carregar.
 */
export default function AuthShell({
  title,
  subtitle,
  tagline,
  footer,
  children,
}: {
  title: string
  subtitle: React.ReactNode
  tagline: string
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <main className="grid min-h-dvh bg-espuma lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <div className="auth-lens-rim h-60 bg-rosa sm:h-72 md:h-96 lg:h-auto">
        <div className="auth-lens relative flex h-full flex-col overflow-hidden bg-ceu text-primary-foreground">
          <div className="relative grid flex-1 place-items-center">
            <span aria-hidden className="lens-ring size-52 border-white/45 [animation-delay:120ms] md:size-64 lg:size-80" />
            <span aria-hidden className="lens-ring size-76 border-white/30 [animation-delay:260ms] md:size-92 lg:size-120" />
            <span aria-hidden className="lens-ring size-100 border-white/20 [animation-delay:400ms] md:size-120 lg:size-160" />
            <div className="relative size-32 md:size-44 lg:size-52">
              <Image
                src="/dermabichos-icon.svg"
                alt="Dermabichos Check"
                width={240}
                height={240}
                className="size-full rounded-full bg-white shadow-[0_18px_50px_-18px_rgb(43_106_146/0.7)] ring-8 ring-white/50"
                priority
              />
              {/* Selo de "conferido", preso à borda do logo a 45° (85,4% = 50% + 50%·cos 45°) */}
              <span aria-hidden className="absolute top-[85.4%] left-[85.4%] -translate-x-1/2 -translate-y-1/2">
                <span className="check-badge grid size-11 place-items-center rounded-full bg-green-600 text-white shadow-[0_8px_20px_-8px_rgb(22_101_52/0.7)] ring-4 ring-ceu md:size-14 lg:size-16">
                  <svg viewBox="0 0 24 24" fill="none" className="size-[58%]">
                    <path className="check-mark" d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
                  </svg>
                </span>
              </span>
            </div>
          </div>
          <p className="relative hidden max-w-xl px-12 pb-14 font-heading text-4xl leading-[1.08] font-bold tracking-tight lg:block xl:text-[2.75rem]">
            {tagline}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-5 pt-8 pb-12 lg:py-16">
        <div className="w-full max-w-sm">
          <h1 className="text-[2rem] leading-tight font-extrabold tracking-tight lg:text-4xl">{title}</h1>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">{subtitle}</p>
          {children}
          {footer && <div className="mt-10 border-t border-border pt-5 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </main>
  )
}

/** Botão principal das telas de acesso: o mesmo botão "pressionável" do checklist. */
export const authSubmitClass =
  'mt-2 h-14 w-full rounded-2xl text-lg font-bold shadow-[0_5px_0_-1px_var(--ceu-deep)] hover:bg-ceu/90 active:not-aria-[haspopup]:translate-y-0.5 active:shadow-[0_2px_0_-1px_var(--ceu-deep)] disabled:shadow-none'

export const authLinkClass =
  'font-semibold text-ceu-deep underline decoration-ceu/60 underline-offset-4 hover:decoration-ceu-deep focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

export function AuthAlert({ tone = 'error', children }: { tone?: 'error' | 'success'; children: React.ReactNode }) {
  const Icon = tone === 'error' ? CircleAlert : CircleCheck
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-relaxed font-medium',
        tone === 'error'
          ? 'border-destructive/25 bg-destructive/5 text-destructive'
          : 'border-ceu/40 bg-accent text-ceu-deep'
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  )
}
