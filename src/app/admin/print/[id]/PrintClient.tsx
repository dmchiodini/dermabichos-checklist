'use client'

import { useEffect } from 'react'

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
    <div className="bg-white text-black min-h-screen p-8 max-w-4xl mx-auto font-sans print:p-0 print:m-0">

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

      <div id="printable-area" className="border border-gray-300 p-4 rounded print:border-none print:p-0">

        <div className="text-center border-b pb-4 mb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wider mb-1">Checklist de Serviço</h1>
          <p className="text-sm text-gray-600 uppercase tracking-widest">Dados do pet e serviços realizados</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="font-bold uppercase text-xs">Pet</p>
            <p className="text-sm">{checklist.pet_nome}</p>
          </div>
          <div>
            <p className="font-bold uppercase text-xs">Tutor</p>
            <p className="text-sm">{checklist.tutor}</p>
          </div>
          <div>
            <p className="font-bold uppercase text-xs">Raça / Espécie</p>
            <p className="text-sm">{checklist.raca} ({checklist.especie})</p>
          </div>
          <div>
            <p className="font-bold uppercase text-xs">Data</p>
            <p className="text-sm">{new Date(checklist.created_at).toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold border-b pb-1 mb-3">1. Serviços Realizados</h2>

          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <h3 className="font-bold text-gray-700 mb-2 uppercase">Banho & Estética</h3>
              <ul className="space-y-1">
                <li><span className="inline-block w-4 h-4 border border-gray-400 text-center leading-none mr-2">{checklist.detalhes?.laco ? '✓' : ''}</span> Laço</li>
                <li><span className="inline-block w-4 h-4 border border-gray-400 text-center leading-none mr-2">{checklist.detalhes?.brilho ? '✓' : ''}</span> Brilho</li>
                <li><span className="inline-block w-4 h-4 border border-gray-400 text-center leading-none mr-2">{checklist.detalhes?.perfume ? '✓' : ''}</span> Perfume</li>
                <li><span className="inline-block w-4 h-4 border border-gray-400 text-center leading-none mr-2">{checklist.detalhes?.escova_dente ? '✓' : ''}</span> Escovação de Dentes</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-700 mb-2 uppercase">Tosa & Hidratação</h3>
              <ul className="space-y-1">
                <li><span className="inline-block w-4 h-4 border border-gray-400 text-center leading-none mr-2">{checklist.tosa?.higienica ? '✓' : ''}</span> Tosa Higiênica</li>
                <li><span className="inline-block w-4 h-4 border border-gray-400 text-center leading-none mr-2">{checklist.tosa?.maquina ? '✓' : ''}</span> Tosa Máquina</li>
                <li><span className="inline-block w-4 h-4 border border-gray-400 text-center leading-none mr-2">{checklist.tosa?.tesoura ? '✓' : ''}</span> Tosa Tesoura</li>
                <li className="mt-2 font-bold">Hidratação:</li>
                <li><span className="inline-block w-4 h-4 border border-gray-400 text-center leading-none mr-2">{checklist.hidratacao?.padrao ? '✓' : ''}</span> Padrão</li>
                <li><span className="inline-block w-4 h-4 border border-gray-400 text-center leading-none mr-2">{checklist.hidratacao?.hipoalergenico ? '✓' : ''}</span> Hipoalergênica</li>
                {checklist.hidratacao?.qual && <li className='mt-1'><strong>Qual:</strong> {checklist.hidratacao.qual}</li>}
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-bold border-b pb-1 mb-3">2. Equipe Responsável</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p><strong>Realizado por:</strong> {getFuncionarioName(checklist.realizado_por_id)}</p>
            <p><strong>Vistoriado por:</strong> {getFuncionarioName(checklist.vistoriado_por_id)}</p>
          </div>
        </div>

        {checklist.observacao && (
          <div className="mb-6">
            <h2 className="text-lg font-bold border-b pb-1 mb-3">3. Observações</h2>
            <div className="p-3 border border-dashed border-gray-400 min-h-16 text-sm">
              <p>{checklist.observacao}</p>
            </div>
          </div>
        )}

        {/* Note: Photos are intentionally omitted as requested */}

        <div className="mt-8 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-gray-600 mb-2 italic">
              Declaro que os serviços selecionados foram conferidos e que as observações descritas correspondem ao estado atual do animal na entrada.
            </p>

            {checklist.assinatura_url ? (
              <div className="flex flex-col items-center justify-center">
                <img src={checklist.assinatura_url} alt="Assinatura" className="h-16 object-contain mix-blend-multiply" />
                <div className="w-64 border-t border-black mt-1"></div>
                <p className="mt-1 font-bold text-sm">{checklist.tutor}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Assinatura Digital Coletada</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center mt-8">
                <div className="w-64 border-t border-black"></div>
                <p className="mt-1 font-bold text-sm">{checklist.tutor}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Assinatura do Tutor</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 mt-12">
          Gerado pelo sistema Dermabichos Check
        </div>

      </div>
    </div>
  )
}
