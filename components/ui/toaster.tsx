"use client"

import { useToast } from "@/hooks/use-toast"
import { X } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-lg shadow-lg border transition-all duration-300 ${
            toast.variant === "destructive"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-white border-gray-200 text-gray-900"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-semibold text-sm">{toast.title}</div>
              {toast.description && <div className="text-sm opacity-80 mt-1">{toast.description}</div>}
            </div>
            <button onClick={() => dismiss(toast.id)} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
