export async function fetchImageByteStream(url: string) {
  const response = await fetch(url)
  return response.body!
}
