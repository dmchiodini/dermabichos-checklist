import React from 'react'
import Image from 'next/image'

/** Mesmo visual da tela de login do painel administrativo. */
export default function AdminAuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <main className="grid min-h-screen bg-espuma md:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ceu p-12 text-primary-foreground md:flex">
        <span aria-hidden className="absolute -right-28 -bottom-28 size-96 rounded-full bg-rosa" />
        <Image
          src="/dermabichos-icon.svg"
          alt="Dermabichos"
          width={120}
          height={120}
          className="relative size-30"
          priority
        />
        <p className="relative max-w-sm font-heading text-4xl leading-[1.1] font-bold tracking-tight">
          Cada banho registrado, cada responsável tranquilo.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <Image
            src="/dermabichos-icon.svg"
            alt="Dermabichos"
            width={88}
            height={88}
            className="mb-8 size-22 rounded-full ring-4 ring-accent md:hidden"
            priority
          />
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
          {children}
        </div>
      </div>
    </main>
  )
}
