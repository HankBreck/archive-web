import { parseCookies, setCookie } from 'nookies'
import { createCda, CDA } from '../../models/helpers'

export type Opts = { maxAge: number; path: string }

export const opts: Opts = {
  maxAge: 30 * 24 * 60 * 60,
  path: '/'
}

export function fetchOrSetTempCDA(): CDA {
  const { cda } = parseCookies()

  if (!cda) {
    const newCda = createCda()
    setCookie(null, 'cda', JSON.stringify(newCda), opts)
    return newCda
  }

  return JSON.parse(cda)
}

export function updateTempCDA(newCda: CDA) {
  setCookie(null, 'cda', JSON.stringify(newCda), opts)
}
