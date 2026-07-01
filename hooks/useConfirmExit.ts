import * as React from "react"

export function useConfirmExit() {
  React.useEffect(() => {
    if (typeof window === "undefined") return

    // Inject phantom state on mount
    window.history.pushState({ trap: true }, "")

    const handlePopState = (event: PopStateEvent) => {
      const confirmExit = window.confirm("Você deseja sair do sistema?")
      if (confirmExit) {
        // User confirmed: remove the listener and go back to let the original action complete
        window.removeEventListener("popstate", handlePopState)
        window.history.back()
      } else {
        // User cancelled: block and re-arm by pushing the trap state back
        window.history.pushState({ trap: true }, "")
      }
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])
}
