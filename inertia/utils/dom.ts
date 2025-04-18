// Scroll to element by ID
export function scrollToAnchor(anchor: string) {
  if (import.meta.server) {
    return
  }
  const element = document.getElementById(anchor)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}
