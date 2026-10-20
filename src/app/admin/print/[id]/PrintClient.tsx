'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { CiMedicalCross } from 'react-icons/ci'

function Box({ checked, label }: { checked?: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="inline-grid size-4 place-items-center rounded-[3px] border border-[#6b7280] text-[11px] leading-none font-bold">
        {checked ? '✓' : ''}
      </span>
      {label}
    </li>
  )
}

export default function PrintClient({ checklist, funcionarios }: { checklist: any, funcionarios: any[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isShare, setIsShare] = useState(false)

  useEffect(() => {
    if (searchParams.get('share') === 'true') {
      setIsShare(true)
    } else {
      // Normal print mode
      const timer = setTimeout(() => {
        window.print()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  const sharePdf = async () => {
    setIsGenerating(true)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      const element = document.getElementById('printable-area')
      if (!element) {
        toast.error('Erro: não foi possível encontrar o conteúdo para gerar o PDF.')
        setIsGenerating(false)
        return
      }

      const opt = {
        margin: 0.5,
        filename: `Checklist_${checklist.pet_nome.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const }
      }

      const worker = html2pdf().set(opt).from(element)
      const pdfBlob = await worker.output('blob')

      const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Checklist Dermabichos - ${checklist.pet_nome}`,
          text: `Segue em anexo o checklist do pet ${checklist.pet_nome}.`
        })
        // Don't route back automatically so they can see the doc if they want, or we can close the window
      } else {
        // Fallback for desktops
        await worker.save()
        toast.success('PDF baixado com sucesso! Você pode enviá-lo pelo WhatsApp Web.')
      }
    } catch (error: any) {
      console.error(error)
      toast.error('Erro ao gerar documento: ' + (error.message || 'Desconhecido'))
    } finally {
      setIsGenerating(false)
    }
  }

  const getFuncionarioName = (id: string) => {
    return funcionarios.find(f => f.id === id)?.nome || id
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl bg-white p-8 text-[#1b3244] print:m-0 print:p-0 relative">
      {isShare && (
        <div className="print:hidden sticky top-0 z-40 mb-8 p-4 bg-ceu/10 border border-ceu/30 rounded-2xl flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-ceu-deep">Modo de Compartilhamento</h2>
            <p className="text-sm text-muted-foreground">Clique no botão para gerar o PDF e enviar pelo WhatsApp.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="grid size-12 place-items-center rounded-xl border-2 border-border bg-white text-muted-foreground hover:bg-muted"
              aria-label="Voltar"
            >
              <span className="font-heading text-2xl leading-none">×</span>
            </button>
            <button
              onClick={sharePdf}
              disabled={isGenerating}
              className="h-12 px-6 rounded-xl bg-rosa text-white font-bold hover:bg-rosa/90 disabled:opacity-50 transition-colors"
            >
              {isGenerating ? 'Gerando...' : 'Gerar e Compartilhar'}
            </button>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="size-12 animate-spin rounded-full border-4 border-ceu border-t-transparent" />
          <p className="mt-4 text-lg font-bold text-ceu-deep">Gerando documento do checklist...</p>
        </div>
      )}

      {/* Hide the top navbar, tabs or any other global Layout elements just in case */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-area, #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}} />

      <div id="printable-area" className="rounded-2xl border border-[#d1d5db] p-6 print:rounded-none print:border-none print:p-0">

        <header className="mb-6 flex items-center gap-4 border-b-2 border-[#79b7de] pb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/dermabichos-logo.svg" alt="Dermabichos" className="size-16" />
          <div>
            <h1 className="text-2xl leading-tight font-extrabold">Checklist Estética Animal</h1>
            <p className="text-sm text-[#4b5563]">Dados do pet e serviços realizados</p>
          </div>
        </header>

        <dl className="mb-6 grid grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-xs text-[#6b7280]">Pet</dt>
            <dd className="font-semibold">{checklist.pet_nome}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#6b7280]">Responsável</dt>
            <dd className="font-semibold">{checklist.tutor}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#6b7280]">Raça / espécie</dt>
            <dd className="font-semibold">{checklist.raca} ({checklist.especie})</dd>
          </div>
          <div>
            <dt className="text-xs text-[#6b7280]">Data</dt>
            <dd className="font-semibold">{new Date(checklist.created_at).toLocaleString('pt-BR')}</dd>
          </div>
        </dl>

        <section className="mb-6">
          <h2 className="mb-3 border-b border-[#d1d5db] pb-1 text-base font-bold">Serviços realizados</h2>
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div>
              <h3 className="mb-2 font-semibold text-[#2b6a92]">Estética e higiene</h3>
              <ul className="space-y-1">
                <Box checked={checklist.detalhes?.laco} label="Laço" />
                <Box checked={checklist.detalhes?.brilho} label="Brilho" />
                <Box checked={checklist.detalhes?.perfume} label="Perfume" />
                <Box checked={checklist.detalhes?.escova_dente} label="Escovação de dentes" />
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-[#2b6a92]">Tosa</h3>
              <ul className="space-y-1">
                <Box checked={checklist.tosa?.higienica} label="Higiênica" />
                <Box checked={checklist.tosa?.maquina} label="Máquina" />
                <Box checked={checklist.tosa?.tesoura} label="Tesoura" />
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-[#2b6a92]">Hidratação</h3>
              <p className="text-sm">
                <strong>Tipo:</strong> {checklist.hidratacao?.qual || (checklist.hidratacao?.hipoalergenico ? 'Hipoalergênica' : checklist.hidratacao?.padrao ? 'Padrão' : 'Nenhuma')}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 border-b border-[#d1d5db] pb-1 text-base font-bold">Equipe responsável</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p><span className="text-[#6b7280]">Realizado por:</span> <strong>{getFuncionarioName(checklist.realizado_por_id)}</strong></p>
            <p><span className="text-[#6b7280]">Vistoriado por:</span> <strong>{getFuncionarioName(checklist.vistoriado_por_id)}</strong></p>
          </div>
        </section>

        {(checklist.observacao || checklist.observacao_cuidados || checklist.detalhes?.observacao_cuidados) && (
          <section className="mb-6">
            <h2 className="mb-3 border-b border-[#d1d5db] pb-1 text-base font-bold">Observações</h2>
            <div className="space-y-3">
              {(checklist.detalhes?.cuidados_medicos || checklist.cuidados_medicos) ? (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 uppercase mb-1">
                    <CiMedicalCross className="size-4 text-red-600" />
                    Alerta de saúde
                  </div>
                  <p className="border-l-4 border-red-500 bg-red-50/60 px-4 py-2.5 text-sm font-medium text-red-950 whitespace-pre-line rounded-r">
                    {checklist.observacao}
                  </p>
                </div>
              ) : (
                checklist.observacao && (
                  <p className="border-l-4 border-[#cd8da7] bg-[#f9fafb] px-4 py-2.5 text-sm whitespace-pre-line rounded-r">
                    {checklist.observacao}
                  </p>
                )
              )}

              {(checklist.observacao_cuidados || checklist.detalhes?.observacao_cuidados) && !(checklist.detalhes?.cuidados_medicos || checklist.cuidados_medicos) && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 uppercase mb-1">
                    <CiMedicalCross className="size-4 text-red-600" />
                    Alerta de saúde
                  </div>
                  <p className="border-l-4 border-red-500 bg-red-50/60 px-4 py-2.5 text-sm font-medium text-red-950 whitespace-pre-line rounded-r">
                    {checklist.observacao_cuidados || checklist.detalhes?.observacao_cuidados}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Note: Photos are intentionally omitted as requested */}

        <div className="mt-10 border-t border-dashed border-[#9ca3af] pt-6 text-center">
          <p className="mx-auto mb-4 max-w-xl text-xs text-[#4b5563] italic">
            Declaro que os serviços selecionados foram conferidos e que as observações descritas correspondem ao estado atual do animal na entrada.
          </p>

          {checklist.assinatura_url ? (
            <div className="flex flex-col items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={checklist.assinatura_url} crossOrigin="anonymous" alt="Assinatura" className="h-16 object-contain mix-blend-multiply" />
              <div className="mt-1 w-64 border-t border-black"></div>
              <p className="mt-1 text-sm font-bold">{checklist.tutor}</p>
              <p className="text-[11px] text-[#6b7280]">Assinatura digital coletada</p>
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center">
              <div className="w-64 border-t border-black"></div>
              <p className="mt-1 text-sm font-bold">{checklist.tutor}</p>
              <p className="text-[11px] text-[#6b7280]">Assinatura do responsável</p>
            </div>
          )}
        </div>

        <p className="mt-12 text-center text-xs text-[#9ca3af]">
          Gerado pelo sistema Dermabichos Check
        </p>

      </div>
    </div>
  )
}
