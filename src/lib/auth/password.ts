import 'server-only'

import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto'

// Parâmetros recomendados pela OWASP para scrypt (N=2^17, r=8, p=1).
const N = 131072
const R = 8
const P = 1
const KEY_LENGTH = 64
const PREFIX = 'scrypt'

function scryptAsync(password: string, salt: Buffer, keylen: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, derivedKey) => (err ? reject(err) : resolve(derivedKey)))
  })
}

const scryptOptions = (n: number, r: number, p: number): ScryptOptions => ({
  N: n,
  r,
  p,
  maxmem: 256 * n * r,
})

/** Gera o hash no formato `scrypt$N$r$p$salt$hash` (base64url). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await scryptAsync(password, salt, KEY_LENGTH, scryptOptions(N, R, P))
  return [PREFIX, N, R, P, salt.toString('base64url'), hash.toString('base64url')].join('$')
}

export function isPasswordHashed(stored: string | null | undefined): boolean {
  return typeof stored === 'string' && stored.startsWith(`${PREFIX}$`)
}

/**
 * Confere a senha. Aceita também senhas legadas em texto puro (cadastradas antes
 * da migração) — nesse caso o chamador deve regravar o hash (`needsRehash`).
 */
export async function verifyPassword(
  password: string,
  stored: string | null | undefined
): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (!stored) return { valid: false, needsRehash: false }

  if (!isPasswordHashed(stored)) {
    const a = Buffer.from(password)
    const b = Buffer.from(stored)
    const valid = a.length === b.length && timingSafeEqual(a, b)
    return { valid, needsRehash: valid }
  }

  const [, nStr, rStr, pStr, saltB64, hashB64] = stored.split('$')
  const n = Number(nStr)
  const r = Number(rStr)
  const p = Number(pStr)
  if (!saltB64 || !hashB64 || !Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) {
    return { valid: false, needsRehash: false }
  }

  const expected = Buffer.from(hashB64, 'base64url')
  const actual = await scryptAsync(password, Buffer.from(saltB64, 'base64url'), expected.length, scryptOptions(n, r, p))
  const valid = actual.length === expected.length && timingSafeEqual(actual, expected)
  return { valid, needsRehash: valid && (n !== N || r !== R || p !== P) }
}
