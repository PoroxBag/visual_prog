import { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { refreshAccessToken } from '@/features/auth/authSlice';

export function ProtectedRoute() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const refreshRequestRef = useRef<string | null>(null);
  const { accessToken, refreshToken, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!user && !accessToken && refreshToken && refreshRequestRef.current !== refreshToken) {
      refreshRequestRef.current = refreshToken;
      void dispatch(refreshAccessToken());
    }
  }, [accessToken, dispatch, refreshToken, user]);

  if (!user || !accessToken) {
    if (refreshToken) {
      return <div className="page-message">Восстанавливаем сессию...</div>;
    }

    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
