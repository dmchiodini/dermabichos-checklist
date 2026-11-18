'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'react-toastify'
import { updateAdminPassword } from '@/app/actions/auth'
import { AuthAlert, authLinkClass, authSubmitClass } from '@/components/auth-shell'
import { PasswordInput } from '@/components/password-input'
import { Button } from '@/components/ui/button'
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
            <PasswordInput id="senhaAtual" name="senhaAtual" required autoComplete="current-password" />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="novaSenha" className="text-base font-semibold">Nova senha</Label>
          <PasswordInput id="novaSenha" name="novaSenha" required minLength={8} autoComplete="new-password" aria-describedby="novaSenha-dica" />
          <p id="novaSenha-dica" className="text-sm text-muted-foreground">Mínimo de 8 caracteres.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmacao" className="text-base font-semibold">Confirmar nova senha</Label>
          <PasswordInput id="confirmacao" name="confirmacao" required minLength={8} autoComplete="new-password" />
        </div>
        {state?.success === false && <AuthAlert>{state.message}</AuthAlert>}
        <Button type="submit" className={authSubmitClass} disabled={isPending || state?.success}>
          {isPending ? 'Salvando...' : 'Salvar nova senha'}
        </Button>
      </form>

      <Link href="/admin/dashboard" className={`mt-8 inline-flex items-center gap-1.5 text-sm ${authLinkClass}`}>
        <ArrowLeft className="size-4" aria-hidden />
        Voltar para o painel
      </Link>
    </>
  )
}
