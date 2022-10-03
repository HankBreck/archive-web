import { NextPageContext } from 'next';
import { parseCookies, setCookie } from 'nookies'
import { createCda, createUser, LocalCDA } from '../../models/helpers'
import User from '../../models/User';

export type Opts = { maxAge: number; path: string }

export const opts: Opts = {
  maxAge: 30 * 24 * 60 * 60,
  path: '/'
}

export function fetchOrSetTempCDA(ctx?: NextPageContext): LocalCDA {
  const { cda } = parseCookies(ctx)

  if (!cda) {
    const newCda = createCda()
    setCookie(ctx, 'cda', JSON.stringify(newCda), opts)
    return newCda
  }

  return JSON.parse(cda)
}

export function updateTempCDA(newCda: LocalCDA, ctx?: NextPageContext) {
  setCookie(ctx, 'cda', JSON.stringify(newCda), opts)
}

export function fetchOrSetUser(ctx?: NextPageContext): User {
  const { user } = parseCookies(ctx)

  if (!user) {
    const newUser = createUser()
    setCookie(ctx, 'user', JSON.stringify(newUser), opts)
    return newUser
  }

  return JSON.parse(user)
}

export function updateUser(newUser: User, ctx?: NextPageContext) {
  setCookie(ctx, 'user', JSON.stringify(newUser), opts)
}

export function setSessionId(id: string, ctx?: NextPageContext) {
  setCookie(ctx, 'sessionId', id, opts)
}

export function getSessionId(ctx?: NextPageContext) {
  const { sessionId } = parseCookies(ctx)
  if (!sessionId) { return }
  return sessionId
}
