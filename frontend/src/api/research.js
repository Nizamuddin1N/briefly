import client from './client'

export async function startResearch(query) {
  const { data } = await client.post('/research', { query })
  return data
}

export async function getResult(taskId) {
  const { data } = await client.get(`/result/${taskId}`)
  return data
}

export async function getHistory() {
  const { data } = await client.get('/history')
  return data
}
