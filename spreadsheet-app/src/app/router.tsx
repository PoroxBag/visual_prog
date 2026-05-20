import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RootRoute } from '@/components/RootRoute';
import { DashboardPage } from '@/features/documents/DashboardPage';
import { SpreadsheetPage } from '@/features/documents/SpreadsheetPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProfilePage } from '@/pages/ProfilePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRoute />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                path: 'dashboard',
                element: <DashboardPage />,
              },
              {
                path: 'documents/:documentId',
                element: <SpreadsheetPage />,
              },
              {
                path: 'profile',
                element: <ProfilePage />,
              },
            ],
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
