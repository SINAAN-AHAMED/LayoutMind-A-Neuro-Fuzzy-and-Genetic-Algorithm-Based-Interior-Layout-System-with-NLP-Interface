import { RouterProvider } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { router } from './router'

export default function App() {
  return (
    <div className="min-h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="min-h-full"
        >
          <RouterProvider router={router} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
