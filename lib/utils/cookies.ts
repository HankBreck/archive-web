import { NextPageContext } from 'next';
import { parseCookies, setCookie } from 'nookies'
import { createCda, createUser, LocalCDA } from '../../models/helpers'
import User from '../../models/User';

export type Opts = { maxAge: number; path: string }

export const opts: Opts = {
  maxAge: 30 * 24 * 60 * 60,
  path: '/'
}

export function fetchOrSetTempCDA(): LocalCDA {
  const { cda } = parseCookies()

  if (!cda) {
    const newCda = createCda()
    setCookie(null, 'cda', JSON.stringify(newCda), opts)
    return newCda
  }

  return JSON.parse(cda)
}

export function updateTempCDA(newCda: LocalCDA) {
  setCookie(null, 'cda', JSON.stringify(newCda), opts)
}

export function fetchOrSetUser(): User {
  const { user } = parseCookies()

  if (!user) {
    const newUser = createUser()
    setCookie(null, 'user', JSON.stringify(newUser), opts)
    return newUser
  }

  return JSON.parse(user)
}

export function updateUser(newUser: User) {
  setCookie(null, 'user', JSON.stringify(newUser), opts)
}

export function setSessionId(id: string) {
  setCookie(null, 'sessionId', id, opts)
}

export function getSessionId(ctx?: NextPageContext) {
  const { sessionId } = parseCookies(ctx)
  if (!sessionId) { return }
  return sessionId
}
