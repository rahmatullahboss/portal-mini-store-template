import { NextRequest, NextResponse } from "next/server"
import { getPayload } from "payload"
import config from "@/payload.config"
import { generatePayloadCookie } from "payload/dist/auth/cookies.js"

const REMEMBER_ME_EXPIRATION_SECONDS = 60 * 60 * 24 * 30 // 30 days

export async function POST(request: NextRequest) {
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 })
  }

  const email = typeof body?.email === "string" ? body.email.trim() : ""
  const password = typeof body?.password === "string" ? body.password : ""
  const rememberMe = body?.rememberMe === true

  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const usersCollection = payload.collections["users"]

  if (!usersCollection?.config?.auth) {
    return NextResponse.json({ message: "Authentication is not enabled for users." }, { status: 500 })
  }

  const authConfig = usersCollection.config.auth
  const originalExpiration = authConfig.tokenExpiration
  const originalRemoveToken = authConfig.removeTokenFromResponses
  const effectiveExpiration = rememberMe ? REMEMBER_ME_EXPIRATION_SECONDS : originalExpiration

  if (rememberMe) {
    authConfig.tokenExpiration = REMEMBER_ME_EXPIRATION_SECONDS
  }

  // Ensure we receive the token so we can manage the cookie manually
  authConfig.removeTokenFromResponses = false

  try {
    const result = (await payload.login({
      collection: "users",
      data: { email, password },
      depth: 0,
    })) as any

    if (!result?.token) {
      throw new Error("Authentication token was not generated")
    }

    const snapshotAuthConfig = {
      ...authConfig,
      tokenExpiration: effectiveExpiration,
      cookies: { ...authConfig.cookies },
    }

    const tokenCookie = generatePayloadCookie({
      collectionAuthConfig: snapshotAuthConfig as any,
      cookiePrefix: payload.config.cookiePrefix,
      token: result.token,
    })

    const responseBody: Record<string, unknown> = {
      message: "Login successful",
      user: result.user,
      exp: result.exp,
    }

    const response = NextResponse.json(responseBody, { status: 200 })
    response.headers.append("Set-Cookie", tokenCookie)
    return response
  } catch (error: any) {
    const status = error?.status ?? error?.statusCode ?? 401
    const message =
      typeof error?.message === "string" && error.message.trim().length > 0
        ? error.message
        : "Login failed. Please check your credentials."
    return NextResponse.json({ message }, { status })
  } finally {
    authConfig.tokenExpiration = originalExpiration
    authConfig.removeTokenFromResponses = originalRemoveToken
  }
}
