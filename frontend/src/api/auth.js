import client from './client'

/** /login expects OAuth2 form encoding — JSON is rejected. */
export async function login(username, password) {
  const form = new URLSearchParams()
  form.append('username', username)
  form.append('password', password)
  const { data } = await client.post('/login', form)
  return data
}

export async function signup({ username, email, password }) {
  const { data } = await client.post('/signup', { username, email, password })
  return data
}

export async function me() {
  const { data } = await client.get('/me')
  return data
}
