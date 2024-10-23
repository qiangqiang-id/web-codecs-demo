/**
 * 将File对象转换为base64 URL
 * @param {File} file - 要转换的文件
 * @return {Promise<string>} base64 URL
 */
export default async function fileToBase64Url(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
