'use client'

import React, { useState } from 'react'
import { login } from '@/app/actions/auth'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Image 
          src="/dermabichos-logo.svg" 
          alt="Dermabichos Logo" 
          width={250} 
          height={80} 
          className="object-contain h-auto w-auto"
          priority
        />
      </div>
      <Card className="w-full max-w-md shadow-lg pt-0">
        <CardHeader className="space-y-1 text-center bg-primary text-primary-foreground rounded-t-xl mb-4 p-6">
          <CardTitle className="text-2xl font-bold">Painel Administrativo</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Digite suas credenciais para gerenciar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-md">E-mail</Label>
              <Input id="email" name="email" type="email" required placeholder="admin@dermabichos.com" className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-md">Senha</Label>
              <Input id="password" name="password" type="password" required className="h-12" />
            </div>
            {error && (
              <p className="text-sm text-red-500 font-medium text-center bg-red-50 p-2 rounded">{error}</p>
            )}
            <Button type="submit" className="w-full h-12 text-lg font-bold mt-4" disabled={isPending}>
              {isPending ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
