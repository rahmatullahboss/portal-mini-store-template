const { getPayload } = require('payload')
const config = require('./src/payload.config.ts')

async function testLogin() {
  try {
    // Initialize Payload
    const payload = await getPayload({ config })

    // Try to login with a test user
    const result = await payload.login({
      collection: 'users',
      data: {
        email: 'test@example.com',
        password: 'password123',
      },
    })

    console.log('Login result:', result)
  } catch (error) {
    console.error('Login error:', error)
  }
}

testLogin()
