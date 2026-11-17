import { hasAdminRecovery, requireAdminPage } from '@/lib/auth/session'
import AdminAuthShell from '../AdminAuthShell'
import ResetPasswordForm from './ResetPasswordForm'

export const dynamic = 'force-dynamic'

export default async function RedefinirSenhaPage() {
  const user = await requireAdminPage()
  const viaRecuperacao = await hasAdminRecovery(user.id)

  return (
    <AdminAuthShell
      title={viaRecuperacao ? 'Criar nova senha' : 'Alterar senha'}
      subtitle={viaRecuperacao ? `Defina a nova senha de ${user.email}.` : 'Informe a senha atual e escolha uma nova.'}
    >
      <ResetPasswordForm pedirSenhaAtual={!viaRecuperacao} />
    </AdminAuthShell>
  )
}
