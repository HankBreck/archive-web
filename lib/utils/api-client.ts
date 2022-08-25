async function handleErrors(response: Response) {
  if (!response.ok) {
    const msg = await response.text()
    throw Error(msg)
  }
  return response
}

// Only supports string: string values
// TODO: update to encode required dtypes
const encodeGetParams = (params: Record<string, string> | undefined) => {
  if (!params) {
    return ''
  }
  return Object.entries(params).map(kv => kv.map(encodeURIComponent).join("=")).join("&")
}

const get = (
  endpoint: string,
  params: Record<string, string> | undefined // Only strings because of encodeGetParams
): Promise<Response> => {

  if (endpoint.startsWith('/')) {
    endpoint = endpoint.slice(1)
  }

  if (!global.window) {
    const server_uri = process.env.NODE_ENV === 'production'
      ? process.env.SERVER_URI!
      : 'http://localhost:3000'
    return fetch(`${server_uri}/api/${endpoint}?${encodeGetParams(params)}`).then(handleErrors)
  }

  // TODO urlencode params
  return fetch(`/api/${endpoint}?${encodeGetParams(params)}`).then(handleErrors)
}

const post = (
  endpoint: string,
  body: Record<string, unknown> | undefined
): Promise<Response> => {
  if (endpoint.startsWith('/')) {
    endpoint = endpoint.slice(1)
  }

  return fetch(`/api/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(body)
  }).then(handleErrors)
}

export const api = { get, post }
export default api