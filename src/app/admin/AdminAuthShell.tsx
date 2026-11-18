import React from 'react'
import AuthShell from '@/components/auth-shell'

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
    <AuthShell title={title} subtitle={subtitle} tagline="Cada banho registrado, cada responsável tranquilo.">
      {children}
    </AuthShell>
  )
}
