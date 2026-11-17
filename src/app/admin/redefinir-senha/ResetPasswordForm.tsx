'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { updateAdminPassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordForm({ pedirSenhaAtual }: { pedirSenhaAtual: boolean }) {
  const [state, formAction, isPending] = useActionState(updateAdminPassword, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message)
      router.push('/admin/dashboard')
    }
  }, [state, router])

  return (
    <>
      <form action={formAction} className="mt-10 space-y-5">
        {pedirSenhaAtual && (
          <div className="space-y-2">
            <Label htmlFor="senhaAtual" className="text-base font-semibold">Senha atual</Label>
            <Input id="senhaAtual" name="senhaAtual" type="password" required autoComplete="current-password" className="h-12" />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="novaSenha" className="text-base font-semibold">Nova senha</Label>
          <Input id="novaSenha" name="novaSenha" type="password" required minLength={8} autoComplete="new-password" className="h-12" />
          <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmacao" className="text-base font-semibold">Confirmar nova senha</Label>
          <Input id="confirmacao" name="confirmacao" type="password" required minLength={8} autoComplete="new-password" className="h-12" />
        </div>
        {state?.success === false && (
          <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">{state.message}</p>
        )}
        <Button type="submit" className="mt-3 h-12 w-full rounded-xl text-base" disabled={isPending || state?.success}>
          {isPending ? 'Salvando...' : 'Salvar nova senha'}
        </Button>
      </form>

      <Link href="/admin/dashboard" className="mt-6 block text-center text-sm font-semibold text-muted-foreground underline hover:text-foreground">
        Voltar para o painel
      </Link>
    </>
  )
}
