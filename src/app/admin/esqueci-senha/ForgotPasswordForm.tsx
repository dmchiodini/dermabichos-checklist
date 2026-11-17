'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { requestAdminPasswordReset } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordForm({ linkInvalido }: { linkInvalido: boolean }) {
  const [state, formAction, isPending] = useActionState(requestAdminPasswordReset, null)

  return (
    <>
      {linkInvalido && !state && (
        <p role="alert" className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
          O link de recuperação é inválido ou expirou. Solicite um novo abaixo.
        </p>
      )}

      {state?.success ? (
        <div className="mt-10 space-y-5">
          <p role="status" className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
            {state.message}
          </p>
          <p className="text-sm text-muted-foreground">
            Abra o link <strong>neste mesmo navegador</strong>. Ele vale por 1 hora.
          </p>
        </div>
      ) : (
        <form action={formAction} className="mt-10 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-semibold">E-mail</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" placeholder="admin@dermabichos.com" className="h-12" />
          </div>
          {state?.success === false && (
            <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">{state.message}</p>
          )}
          <Button type="submit" className="mt-3 h-12 w-full rounded-xl text-base" disabled={isPending}>
            {isPending ? 'Enviando...' : 'Enviar link de recuperação'}
          </Button>
        </form>
      )}

      <Link href="/admin/login" className="mt-6 block text-center text-sm font-semibold text-muted-foreground underline hover:text-foreground">
        Voltar para o login
      </Link>
    </>
  )
}
