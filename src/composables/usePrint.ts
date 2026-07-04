export function usePrint() {
  function printElement(title: string) {
    const currentTitle = document.title
    document.title = `${title} · Allio`
    window.print()
    document.title = currentTitle
  }

  return { printElement }
}
