export function getParam(uri: string, param: string): string | null {
  // remove hash
  uri = uri.split('#')[0]
  const urlParams = new URLSearchParams(uri.split('?')[1] || '')
  return urlParams.get(param) || null
}
