import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { routes } from '@/shared/config/routes'
import { HomePage } from '@/pages/home/HomePage'
import { LinearFunctionLessonPage } from '@/pages/lessons/linear-function/LinearFunctionLessonPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'

const router = createBrowserRouter([
  {
    path: routes.home,
    element: <HomePage />,
  },
  {
    path: routes.linearFunctionLesson,
    element: <LinearFunctionLessonPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
