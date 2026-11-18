'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { login } from '@/app/actions/auth'
import AuthShell, { AuthAlert, authLinkClass, authSubmitClass } from '@/components/auth-shell'
import { PasswordInput } from '@/components/password-input'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

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
      setError(result.message ?? 'E-mail ou senha incorretos')
      setIsPending(false)
    }
  }

  return (
    <AuthShell
      title="Painel administrativo"
      subtitle="Entre com o e-mail e a senha do administrador."
      tagline="Cada banho registrado, cada responsável tranquilo."
      footer={
        <>
          Trabalha na recepção ou no banho? <Link href="/login" className={authLinkClass}>Acesso da equipe</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="mt-10 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-base font-semibold">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="admin@dermabichos.com"
            aria-invalid={error ? true : undefined}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor="password" className="text-base font-semibold">Senha</Label>
            <Link href="/admin/esqueci-senha" className={`text-sm ${authLinkClass}`}>
              Esqueci minha senha
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            required
            autoComplete="current-password"
            aria-invalid={error ? true : undefined}
          />
        </div>
        {error && <AuthAlert>{error}</AuthAlert>}
        <Button type="submit" className={authSubmitClass} disabled={isPending}>
          {isPending ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </AuthShell>
  )
}
