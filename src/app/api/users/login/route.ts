import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

const REMEMBER_ME_EXPIRATION_SECONDS = 60 * 60 * 24 * 30 // 30 days

function buildAuthCookie({
  authConfig,
  cookiePrefix,
  token,
  expiresInSeconds,
}: {
  authConfig: any
  cookiePrefix: string
  token: string
  expiresInSeconds: number
}) {
  const cookieParts: string[] = []
  const name = `${cookiePrefix}-token`
  const expires = new Date(Date.now() + expiresInSeconds * 1000)
  const cookiesConfig = authConfig.cookies || {}
  const sameSite =
    typeof cookiesConfig.sameSite === 'string'
      ? cookiesConfig.sameSite
      : cookiesConfig.sameSite
        ? 'Strict'
        : undefined

  cookieParts.push(`${name}=${token}`)
  cookieParts.push(`Expires=${expires.toUTCString()}`)

  if (cookiesConfig.domain) {
    cookieParts.push(`Domain=${cookiesConfig.domain}`)
  }

  cookieParts.push('Path=/')
  cookieParts.push('HttpOnly')

  if (cookiesConfig.secure) {
    cookieParts.push('Secure')
  }

  if (sameSite) {
    cookieParts.push(`SameSite=${sameSite}`)
  }

  return cookieParts.join('; ')
}

async function parseRequestBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  const contentType = request.headers.get('content-type') || ''

  try {
    if (contentType.includes('application/json') || contentType === '') {
      return await request.json()
    }

    if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const formData = await request.formData()
      const result: Record<string, unknown> = {}

      for (const [key, value] of formData.entries()) {
        result[key] = typeof value === 'string' ? value : value.name
      }

      return result
    }

    if (contentType.includes('text/plain')) {
      const text = await request.text()
      if (text.trim().length === 0) return {}
      return JSON.parse(text)
    }
  } catch (error) {
    console.error('Failed to parse login request body', error)
    return null
  }

  return null
}

export async function POST(request: NextRequest) {
  const body = await parseRequestBody(request)

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 })
  }

  // Debug logging
  console.log('Login request body:', body)

  const emailValue = (body as Record<string, unknown>).email
  const passwordValue = (body as Record<string, unknown>).password
  const rememberMeValue = (body as Record<string, unknown>).rememberMe

  console.log('Email value:', emailValue)
  console.log('Password value:', passwordValue)

  const email = typeof emailValue === 'string' ? emailValue.trim() : ''
  const password = typeof passwordValue === 'string' ? passwordValue : ''
  const rememberMe =
    rememberMeValue === true ||
    rememberMeValue === 'true' ||
    rememberMeValue === '1' ||
    rememberMeValue === 'on' ||
    rememberMeValue === 1

  console.log('Processed email:', email)
  console.log('Processed password:', password)

  if (!email || !password) {
    return NextResponse.json({ message: 'Email and password are required' }, { status: 400 })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const usersCollection = payload.collections['users']

  if (!usersCollection?.config?.auth) {
    return NextResponse.json(
      { message: 'Authentication is not enabled for users.' },
      { status: 500 },
    )
  }

  const authConfig = usersCollection.config.auth
  const originalExpiration = authConfig.tokenExpiration
  const originalRemoveToken = authConfig.removeTokenFromResponses === true
  const effectiveExpiration = rememberMe ? REMEMBER_ME_EXPIRATION_SECONDS : originalExpiration

  if (rememberMe) {
    authConfig.tokenExpiration = REMEMBER_ME_EXPIRATION_SECONDS
  }

  // Ensure we receive the token so we can manage the cookie manually
  ;(authConfig as any).removeTokenFromResponses = false

  try {
    const result = (await payload.login({
      collection: 'users',
      data: { email, password },
      depth: 0,
    })) as any

    if (!result?.token) {
      throw new Error('Authentication token was not generated')
    }

    const tokenCookie = buildAuthCookie({
      authConfig,
      cookiePrefix: payload.config.cookiePrefix,
      token: result.token,
      expiresInSeconds: effectiveExpiration,
    })

    const responseBody: Record<string, unknown> = {
      message: 'Login successful',
      user: result.user,
      exp: result.exp,
    }

    const response = NextResponse.json(responseBody, { status: 200 })
    response.headers.append('Set-Cookie', tokenCookie)
    return response
  } catch (error: any) {
    const status = error?.status ?? error?.statusCode ?? 401
    const message =
      typeof error?.message === 'string' && error.message.trim().length > 0
        ? error.message
        : 'Login failed. Please check your credentials.'
    return NextResponse.json({ message }, { status })
  } finally {
    authConfig.tokenExpiration = originalExpiration
    ;(authConfig as any).removeTokenFromResponses = originalRemoveToken
  }
}
