'use client'
import { motion } from 'framer-motion'

interface Props {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-20 text-center px-6"
    >
      {icon && (
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'var(--f-75)', color: 'var(--f-500)' }}
        >
          {icon}
        </div>
      )}
      <p className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
        {title}
      </p>
      {description && (
        <p className="text-[13px] mt-1 max-w-xs" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  )
}
