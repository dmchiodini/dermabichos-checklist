'use client'

import React, { useState } from 'react'
import { login } from '@/app/actions/auth'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Image from 'next/image'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await login(formData)

    // Se chegou aqui e tem result, é porque deu erro (o redirect aborta a função em caso de sucesso)
    if (result && !result.success) {
      setError(result.message)
      setIsPending(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-espuma md:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ceu p-12 text-primary-foreground md:flex">
        <span aria-hidden className="absolute -right-28 -bottom-28 size-96 rounded-full bg-rosa" />
        <Image
          src="/dermabichos-logo.svg"
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
            src="/dermabichos-logo.svg"
            alt="Dermabichos"
            width={88}
            height={88}
            className="mb-8 size-22 rounded-full ring-4 ring-accent md:hidden"
            priority
          />
          <h1 className="text-3xl font-extrabold tracking-tight">Painel administrativo</h1>
          <p className="mt-2 text-muted-foreground">Entre com o e-mail e a senha da equipe.</p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-semibold">E-mail</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" placeholder="admin@dermabichos.com" className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-semibold">Senha</Label>
              <Input id="password" name="password" type="password" required autoComplete="current-password" className="h-12" />
            </div>
            {error && (
              <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">{error}</p>
            )}
            <Button type="submit" className="mt-3 h-12 w-full rounded-xl text-base" disabled={isPending}>
              {isPending ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
