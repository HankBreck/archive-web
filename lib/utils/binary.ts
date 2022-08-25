/**
 * Decodes UTF-8 encoded `bytes`
 * @param bytes encoded Uint8Array
 * @returns UTF-8 decoded string of `bytes`
 */
const bytesToUtf8 = (bytes: Uint8Array) => {
  const decoder = new TextDecoder('utf-8')
  return decoder.decode(bytes)
}

/**
 * Encodes `input` using `TextEncoder`
 * 
 * @param input encoder input
 * @returns UTF-8 encoding of `input` as Uint8Array
 */
const utf8ToBytes = (input: string) => {
  const encoder = new TextEncoder()
  return encoder.encode(input)
}

export { bytesToUtf8, utf8ToBytes }