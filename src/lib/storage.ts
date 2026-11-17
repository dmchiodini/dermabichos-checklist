import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import { STORAGE_BUCKET } from '@/lib/supabase/admin'

const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10 MB por foto
const MAX_SIGNATURE_BYTES = 2 * 1024 * 1024 // 2 MB

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
}

export class UploadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UploadError'
  }
}

/** Valida um arquivo de imagem (tipo e tamanho) e devolve o MIME/extensão confiáveis. */
function resolveImageType(file: File): { mime: string; ext: string } {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new UploadError(`A imagem "${file.name}" excede o limite de 10 MB.`)
  }

  // Alguns navegadores não informam o tipo de HEIC; nesse caso usamos a extensão.
  let mime = file.type?.toLowerCase() || ''
  if (!mime) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    mime = EXT_TO_MIME[ext] ?? ''
  }

  const ext = MIME_TO_EXT[mime]
  if (!ext) {
    throw new UploadError(`O arquivo "${file.name}" não é uma imagem válida (JPG, PNG, WEBP, GIF ou HEIC).`)
  }
  return { mime, ext }
}

export function isUploadableFile(value: FormDataEntryValue | null): value is File {
  return typeof value === 'object' && value !== null && 'size' in value && value.size > 0
}

export async function uploadImage(
  supabase: SupabaseClient<Database>,
  folder: 'fotos' | 'funcionarios',
  file: File
): Promise<{ path: string; publicUrl: string }> {
  const { mime, ext } = resolveImageType(file)
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, buffer, { contentType: mime, upsert: false })
  if (error) {
    console.error(`[storage] erro no upload (${folder}):`, error)
    throw new UploadError('Falha ao enviar a imagem. Tente novamente.')
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}

const SIGNATURE_PREFIX = /^data:image\/png;base64,/

export function isSignatureDataUrl(value: unknown): value is string {
  return typeof value === 'string' && SIGNATURE_PREFIX.test(value)
}

export async function uploadSignature(
  supabase: SupabaseClient<Database>,
  dataUrl: string
): Promise<{ path: string; publicUrl: string }> {
  const buffer = Buffer.from(dataUrl.replace(SIGNATURE_PREFIX, ''), 'base64')
  if (buffer.length === 0 || buffer.length > MAX_SIGNATURE_BYTES) {
    throw new UploadError('Assinatura inválida.')
  }
  // Confere a assinatura PNG (magic bytes) para garantir que é mesmo uma imagem.
  if (buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new UploadError('Assinatura inválida.')
  }

  const path = `assinaturas/${crypto.randomUUID()}.png`
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, buffer, { contentType: 'image/png', upsert: false })
  if (error) {
    console.error('[storage] erro no upload da assinatura:', error)
    throw new UploadError('Falha ao enviar assinatura')
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}

export async function removeFiles(supabase: SupabaseClient<Database>, paths: string[]) {
  if (paths.length === 0) return
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(paths)
  if (error) console.error('[storage] erro ao remover arquivos órfãos:', error)
}
