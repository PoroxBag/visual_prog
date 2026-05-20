import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';

export function ProtectedRoute() {
  const user = useAppSelector((state) => state.auth.user);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
