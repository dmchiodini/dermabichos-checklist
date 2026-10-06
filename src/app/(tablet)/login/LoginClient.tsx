'use client'

import React, { useActionState } from 'react'
import Image from 'next/image'
import { loginFuncionario } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginClient() {
  const [state, formAction, isPending] = useActionState(loginFuncionario, null)

  return (
    <main className="grid min-h-screen bg-espuma md:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ceu p-12 text-primary-foreground md:flex">
        <span aria-hidden className="absolute -right-28 -bottom-50 size-80 rounded-full bg-rosa" />
        <div className='h-full w-full flex items-center justify-center'>
          <Image
            src="/dermabichos-logo.svg"
            alt="Dermabichos"
            width={400}
            height={400}
            className="relative size-80"
            priority
          />
        </div>
        <p className="relative max-w-sm font-heading text-4xl leading-[1.1] font-bold tracking-tight">
          Acesso da equipe.<br />Recepção e Banho/Tosa.
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
          <h1 className="text-3xl font-extrabold tracking-tight">Acesso da Equipe</h1>
          <p className="mt-2 text-muted-foreground">Entre com seu usuário e senha.</p>

          <form action={formAction} className="mt-10 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login" className="text-base font-semibold">Usuário</Label>
              <Input id="login" name="login" type="text" required placeholder="Digite seu usuário" className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha" className="text-base font-semibold">Senha</Label>
              <Input id="senha" name="senha" type="password" required className="h-12" />
            </div>
            {state?.success === false && (
              <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">{state.message}</p>
            )}
            <Button type="submit" className="mt-3 h-12 w-full rounded-xl text-base bg-rosa hover:bg-rosa/90" disabled={isPending}>
              {isPending ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </main >
  )
}
