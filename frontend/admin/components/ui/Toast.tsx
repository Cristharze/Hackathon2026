'use client'
import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  message: string
  type: 'success' | 'error'
  onDismiss: () => void
}

export function Toast({ message, type, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3800)
    return () => clearTimeout(t)
  }, [onDismiss])

  const isSuccess = type === 'success'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl text-[13.5px] font-medium max-w-sm"
        style={{
          background: isSuccess ? 'var(--f-600)' : '#dc2626',
          color: '#fff',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <span className="shrink-0">
          {isSuccess ? (
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          )}
        </span>
        {message}
      </motion.div>
    </AnimatePresence>
  )
}
