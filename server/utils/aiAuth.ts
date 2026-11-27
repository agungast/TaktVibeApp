import { createError } from 'h3'

export interface AiUser {
  id: string
}

/** Map semua kegagalan sesi (termasuk JWT expired) ke 401, bukan 500. */
export async function requireAiUser(loadUser: () => Promise<unknown>): Promise<AiUser> {
  let user: unknown
  try {
    user = await loadUser()
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  if (!user || typeof (user as AiUser).id !== 'string' || !(user as AiUser).id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return user as AiUser
}
