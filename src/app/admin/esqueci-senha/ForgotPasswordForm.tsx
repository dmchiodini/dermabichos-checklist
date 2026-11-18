'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requestAdminPasswordReset } from '@/app/actions/auth'
import { AuthAlert, authLinkClass, authSubmitClass } from '@/components/auth-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordForm({ linkInvalido }: { linkInvalido: boolean }) {
  const [state, formAction, isPending] = useActionState(requestAdminPasswordReset, null)

  return (
    <>
      {linkInvalido && !state && (
        <div className="mt-8">
          <AuthAlert>O link de recuperação é inválido ou expirou. Solicite um novo abaixo.</AuthAlert>
        </div>
      )}

      {state?.success ? (
        <div className="mt-10 space-y-4">
          <AuthAlert tone="success">{state.message}</AuthAlert>
          <p className="text-sm text-muted-foreground">
            Abra o link <strong className="text-foreground">neste mesmo navegador</strong>. Ele vale por 1 hora.
          </p>
        </div>
      ) : (
        <form action={formAction} className="mt-10 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-semibold">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="admin@dermabichos.com"
              aria-invalid={state?.success === false || undefined}
            />
          </div>
          {state?.success === false && <AuthAlert>{state.message}</AuthAlert>}
          <Button type="submit" className={authSubmitClass} disabled={isPending}>
            {isPending ? 'Enviando...' : 'Enviar link de recuperação'}
          </Button>
        </form>
      )}

      <Link href="/admin/login" className={`mt-8 inline-flex items-center gap-1.5 text-sm ${authLinkClass}`}>
        <ArrowLeft className="size-4" aria-hidden />
        Voltar para o login
      </Link>
    </>
  )
}
