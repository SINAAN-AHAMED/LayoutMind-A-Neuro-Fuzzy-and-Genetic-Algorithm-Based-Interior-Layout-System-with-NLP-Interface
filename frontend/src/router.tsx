import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from './routes/RootLayout'
import { PromptStudioPage } from './routes/PromptStudioPage'
import { WorkspacePage } from './routes/WorkspacePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <PromptStudioPage /> },
      { path: 'workspace', element: <WorkspacePage /> },
    ],
  },
])

