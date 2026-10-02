import { useEffect, useRef, type ReactNode } from 'react'

export function Modal({ title, onClose, children }: { title: string; onClose(): void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    return () => dialog.close()
  }, [])

  return (
    <dialog
      ref={ref}
      className="modal"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      // Kliknięcie w tło: celem jest sam <dialog>, nie jego zawartość.
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <div className="modal-body">
        <h2>{title}</h2>
        {children}
      </div>
    </dialog>
  )
}
