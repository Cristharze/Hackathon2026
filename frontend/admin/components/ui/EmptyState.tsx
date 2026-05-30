import { motion } from 'framer-motion'

interface Props {
  icon?: React.ReactNode
  title: string
  description?: string
}

export function EmptyState({ icon, title, description }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
          {icon}
        </div>
      )}
      <p className="text-slate-700 font-medium">{title}</p>
      {description && <p className="text-slate-400 text-sm mt-1 max-w-xs">{description}</p>}
    </motion.div>
  )
}
