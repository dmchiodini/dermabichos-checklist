'use client'

import React, { useActionState } from 'react'
import Link from 'next/link'
import { loginFuncionario } from '@/app/actions/auth'
import AuthShell, { AuthAlert, authLinkClass, authSubmitClass } from '@/components/auth-shell'
import { PasswordInput } from '@/components/password-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginClient() {
  const [state, formAction, isPending] = useActionState(loginFuncionario, null)

  return (
    <AuthShell
      title="Acesso da equipe"
      subtitle="Entre com o usuário e a senha que o administrador cadastrou para você."
      tagline="Cada pet conferido na entrada e na saída."
      footer={
        <>
          É administrador? <Link href="/admin/login" className={authLinkClass}>Entrar no painel</Link>
        </>
      }
    >
      <form action={formAction} className="mt-10 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="login" className="text-base font-semibold">Usuário</Label>
          {/* Sem maiúscula/correção automática: o login diferencia maiúsculas no tablet */}
          <Input
            id="login"
            name="login"
            type="text"
            required
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Seu usuário"
            aria-invalid={state?.success === false || undefined}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="senha" className="text-base font-semibold">Senha</Label>
          <PasswordInput
            id="senha"
            name="senha"
            required
            autoComplete="current-password"
            aria-invalid={state?.success === false || undefined}
          />
        </div>
        {state?.success === false && <AuthAlert>{state.message}</AuthAlert>}
        <Button type="submit" className={authSubmitClass} disabled={isPending}>
          {isPending ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </AuthShell>
  )
}
