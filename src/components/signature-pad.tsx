'use client'

import React, { useRef, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'

interface SignaturePadProps {
  onEnd: (base64: string) => void
  error?: string
}

export function SignaturePad({ onEnd, error }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null)

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
      const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png')
      onEnd(dataUrl || '')
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className={`border-2 rounded-md bg-white ${error ? 'border-red-500' : 'border-gray-300'}`}>
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: 'w-full h-48 rounded-md touch-none',
          }}
          onEnd={handleEnd}
        />
      </div>
      {error && <p className="text-sm font-medium text-red-500">{error}</p>}
      <Button 
        type="button" 
        variant="outline" 
        onClick={handleClear} 
        className="w-full h-12 text-base font-medium"
      >
        Limpar Assinatura
      </Button>
    </div>
  )
}
