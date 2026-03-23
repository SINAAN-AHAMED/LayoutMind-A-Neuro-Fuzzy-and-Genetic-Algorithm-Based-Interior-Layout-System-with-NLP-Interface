import { Outlet } from 'react-router-dom'

export function RootLayout() {
  return (
    <div className="min-h-full">
      <div className="pointer-events-none fixed inset-0 opacity-60 grid-glow" />
      <Outlet />
    </div>
  )
}

