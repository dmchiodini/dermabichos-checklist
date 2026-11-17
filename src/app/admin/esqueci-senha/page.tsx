import AdminAuthShell from '../AdminAuthShell'
import ForgotPasswordForm from './ForgotPasswordForm'

export const dynamic = 'force-dynamic'

export default async function EsqueciSenhaPage(props: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await props.searchParams

  return (
    <AdminAuthShell
      title="Esqueci minha senha"
      subtitle="Informe o e-mail do administrador. Vamos enviar um link para você criar uma nova senha."
    >
      <ForgotPasswordForm linkInvalido={erro === 'link'} />
    </AdminAuthShell>
  )
}
