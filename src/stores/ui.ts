import { defineStore } from 'pinia'

export type ToastTone = 'info' | 'success' | 'warning' | 'error'

export interface Toast {
  id: number
  title: string
  message?: string
  tone: ToastTone
  duration: number
  icon?: string
}

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  icon?: string
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void
}

interface UIState {
  toasts: Toast[]
  nextToastId: number
  confirm: ConfirmState | null
}

const toneIconFallback: Record<ToastTone, string> = {
  info: 'fa-solid fa-circle-info',
  success: 'fa-solid fa-circle-check',
  warning: 'fa-solid fa-triangle-exclamation',
  error: 'fa-solid fa-circle-xmark',
}

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    toasts: [],
    nextToastId: 1,
    confirm: null,
  }),

  actions: {
    showToast(input: {
      title: string
      message?: string
      tone?: ToastTone
      duration?: number
      icon?: string
    }) {
      const tone = input.tone ?? 'info'
      const id = this.nextToastId++
      const toast: Toast = {
        id,
        title: input.title,
        message: input.message,
        tone,
        duration: input.duration ?? 4200,
        icon: input.icon ?? toneIconFallback[tone],
      }
      this.toasts.push(toast)
      if (toast.duration > 0) {
        setTimeout(() => this.dismissToast(id), toast.duration)
      }
      return id
    },

    dismissToast(id: number) {
      const idx = this.toasts.findIndex((t) => t.id === id)
      if (idx >= 0) this.toasts.splice(idx, 1)
    },

    requestConfirm(options: ConfirmOptions): Promise<boolean> {
      if (this.confirm) {
        this.confirm.resolve(false)
        this.confirm = null
      }
      return new Promise<boolean>((resolve) => {
        this.confirm = { ...options, resolve }
      })
    },

    resolveConfirm(value: boolean) {
      if (!this.confirm) return
      this.confirm.resolve(value)
      this.confirm = null
    },
  },
})
