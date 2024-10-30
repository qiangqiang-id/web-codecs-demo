export async function fetchUrlByteStream(url: string) {
  const response = await fetch(url)
  return response.body!
}

export async function fetchUrlFile(url: string) {
  const response = await fetch(url)

  const blob = await response.blob()

  return new File([blob], 'test.mp4')
}
