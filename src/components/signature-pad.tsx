'use client'

import React, { useRef, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Eraser } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SignaturePadProps {
  onEnd: (base64: string) => void
  error?: string
  value?: string
  readOnly?: boolean
}

export function SignaturePad({ onEnd, error, value, readOnly }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null)

  useEffect(() => {
    if (value && sigCanvas.current) {
      // Clear before loading to ensure we don't draw over existing strokes
      // Removemos as dimensões fixas para ele se ajustar ao tamanho real do canvas (w-full)
      sigCanvas.current.fromDataURL(value, { ratio: Math.max(window.devicePixelRatio || 1, 1) })
      // Use setOptions to disable drawing if readonly
      if (readOnly) {
        sigCanvas.current.off()
      } else {
        sigCanvas.current.on()
      }
    } else if (readOnly && sigCanvas.current) {
       sigCanvas.current.off()
    } else if (!readOnly && sigCanvas.current) {
       sigCanvas.current.on()
    }
  }, [value, readOnly])

  // Desabilita o scroll nativo no mobile/tablet quando tocar no canvas
  useEffect(() => {
    const canvas = sigCanvas.current?.getCanvas()
    if (canvas) {
      const preventScroll = (e: TouchEvent) => {
        if (e.target === canvas) {
          e.preventDefault()
        }
      }
      document.body.addEventListener('touchstart', preventScroll, { passive: false })
      document.body.addEventListener('touchmove', preventScroll, { passive: false })
      return () => {
        document.body.removeEventListener('touchstart', preventScroll)
        document.body.removeEventListener('touchmove', preventScroll)
      }
    }
  }, [])

  const handleClear = () => {
    sigCanvas.current?.clear()
    onEnd('')
  }

  const handleEnd = () => {
    if (sigCanvas.current?.isEmpty()) {
      onEnd('')
    } else {
      const dataUrl = sigCanvas.current?.getCanvas().toDataURL('image/png')
      onEnd(dataUrl || '')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className={`relative rounded-2xl border-2 bg-white ${error ? 'border-destructive' : 'border-border'}`}>
        <div aria-hidden className="pointer-events-none absolute inset-x-6 bottom-12 flex items-end gap-2 text-muted-foreground/70">
          <span className="font-heading text-2xl leading-none">×</span>
          <span className="mb-1 flex-1 border-b border-input" />
        </div>
        <SignatureCanvas
          ref={sigCanvas}
          penColor="#1b3244"
          canvasProps={{
            className: `relative w-full h-56 rounded-2xl touch-none ${readOnly ? 'pointer-events-none' : ''}`,
            'aria-label': 'Área de assinatura do tutor',
          }}
          onEnd={handleEnd}
        />
      </div>
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          onClick={handleClear}
          className="h-12 self-end rounded-xl px-5 text-base font-semibold text-muted-foreground"
        >
          <Eraser className="size-4" aria-hidden />
          Limpar assinatura
        </Button>
      )}
    </div>
  )
}
