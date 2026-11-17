import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      'Variável de ambiente SESSION_SECRET ausente ou curta demais (mínimo 32 caracteres). ' +
      'Gere uma com: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"'
    )
  }
  return secret
}

function sign(value: string): string {
  return createHmac('sha256', getSecret()).update(value).digest('base64url')
}

/** Gera um token `payload.assinatura` (HMAC-SHA256) com expiração embutida. */
export function encodeSignedToken<T extends object>(payload: T, ttlSeconds: number): string {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttlSeconds * 1000 })).toString('base64url')
  return `${body}.${sign(body)}`
}

/** Valida assinatura e expiração; retorna o payload ou null. */
export function decodeSignedToken<T extends object>(token: string | undefined): (T & { exp: number }) | null {
  if (!token) return null
  const [body, signature] = token.split('.')
  if (!body || !signature) return null

  const expected = Buffer.from(sign(body))
  const received = Buffer.from(signature)
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (typeof payload !== 'object' || payload === null || typeof payload.exp !== 'number') return null
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}
