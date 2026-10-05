'use client'

import { useEffect } from 'react'

function Box({ checked, label }: { checked?: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="inline-grid size-4 place-items-center rounded-[3px] border border-gray-500 text-[11px] leading-none font-bold">
        {checked ? '✓' : ''}
      </span>
      {label}
    </li>
  )
}

export default function PrintClient({ checklist, funcionarios }: { checklist: any, funcionarios: any[] }) {
  useEffect(() => {
    // Timeout to ensure signature image loads before printing
    const timer = setTimeout(() => {
      window.print()
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const getFuncionarioName = (id: string) => {
    return funcionarios.find(f => f.id === id)?.nome || id
  }

  return (
    <div className="mx-auto min-h-screen max-w-4xl bg-white p-8 text-[#1b3244] print:m-0 print:p-0">

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

      <div id="printable-area" className="rounded-2xl border border-gray-300 p-6 print:rounded-none print:border-none print:p-0">

        <header className="mb-6 flex items-center gap-4 border-b-2 border-[#79b7de] pb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/dermabichos-logo.svg" alt="Dermabichos" className="size-16" />
          <div>
            <h1 className="text-2xl leading-tight font-extrabold">Checklist de banho e tosa</h1>
            <p className="text-sm text-gray-600">Dados do pet e serviços realizados</p>
          </div>
        </header>

        <dl className="mb-6 grid grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-xs text-gray-500">Pet</dt>
            <dd className="font-semibold">{checklist.pet_nome}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Tutor</dt>
            <dd className="font-semibold">{checklist.tutor}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Raça / espécie</dt>
            <dd className="font-semibold">{checklist.raca} ({checklist.especie})</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500">Data</dt>
            <dd className="font-semibold">{new Date(checklist.created_at).toLocaleString('pt-BR')}</dd>
          </div>
        </dl>

        <section className="mb-6">
          <h2 className="mb-3 border-b border-gray-300 pb-1 text-base font-bold">Serviços realizados</h2>
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
              <ul className="space-y-1">
                <Box checked={checklist.hidratacao?.padrao} label="Padrão" />
                <Box checked={checklist.hidratacao?.hipoalergenico} label="Hipoalergênica" />
                {checklist.hidratacao?.qual && <li className="mt-1"><strong>Qual:</strong> {checklist.hidratacao.qual}</li>}
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 border-b border-gray-300 pb-1 text-base font-bold">Equipe responsável</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p><span className="text-gray-500">Realizado por:</span> <strong>{getFuncionarioName(checklist.realizado_por_id)}</strong></p>
            <p><span className="text-gray-500">Vistoriado por:</span> <strong>{getFuncionarioName(checklist.vistoriado_por_id)}</strong></p>
          </div>
        </section>

        {checklist.observacao && (
          <section className="mb-6">
            <h2 className="mb-3 border-b border-gray-300 pb-1 text-base font-bold">Observações</h2>
            <p className="min-h-16 border-l-4 border-[#cd8da7] bg-gray-50 px-4 py-3 text-sm whitespace-pre-line">{checklist.observacao}</p>
          </section>
        )}

        {/* Note: Photos are intentionally omitted as requested */}

        <div className="mt-10 border-t border-dashed border-gray-400 pt-6 text-center">
          <p className="mx-auto mb-4 max-w-xl text-xs text-gray-600 italic">
            Declaro que os serviços selecionados foram conferidos e que as observações descritas correspondem ao estado atual do animal na entrada.
          </p>

          {checklist.assinatura_url ? (
            <div className="flex flex-col items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={checklist.assinatura_url} alt="Assinatura" className="h-16 object-contain mix-blend-multiply" />
              <div className="mt-1 w-64 border-t border-black"></div>
              <p className="mt-1 text-sm font-bold">{checklist.tutor}</p>
              <p className="text-[11px] text-gray-500">Assinatura digital coletada</p>
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center">
              <div className="w-64 border-t border-black"></div>
              <p className="mt-1 text-sm font-bold">{checklist.tutor}</p>
              <p className="text-[11px] text-gray-500">Assinatura do tutor</p>
            </div>
          )}
        </div>

        <p className="mt-12 text-center text-xs text-gray-400">
          Gerado pelo sistema Dermabichos Check
        </p>

      </div>
    </div>
  )
}
