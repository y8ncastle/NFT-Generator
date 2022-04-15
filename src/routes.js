import { Navigate, useRoutes } from 'react-router-dom';
import MainLayout from './layouts/main';
import Main from './pages/Main';

export default function Router() {
  return useRoutes([
    {
      path: '/main',
      element: <MainLayout />,
      children: [{ path: 'app', element: <Main /> }],
    },
    {
      path: '/',
      element: <MainLayout />,
      children: [{ path: '/', element: <Navigate to="/main/app" /> }],
    },
  ]);
}
