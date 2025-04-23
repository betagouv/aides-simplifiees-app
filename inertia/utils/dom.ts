// Scroll to element by ID
export function scrollToAnchor(anchor: string) {
  if (typeof document === 'undefined') {
    return
  }
  const element = document.getElementById(anchor)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}
