import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { refreshAccessToken } from '@/features/auth/authSlice';
import { CreateDocumentModal } from '@/features/documents/CreateDocumentModal';
import { clearNotification } from '@/features/ui/uiSlice';
import { authService } from '@/services/authService';

export function RootRoute() {
  const dispatch = useAppDispatch();
  const isCreateDocumentModalOpen = useAppSelector((state) => state.ui.isCreateDocumentModalOpen);
  const notification = useAppSelector((state) => state.ui.notification);
  const saveStatus = useAppSelector((state) => state.documents.saveStatus);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const refreshToken = useAppSelector((state) => state.auth.refreshToken);
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (saveStatus !== 'saved') {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  useEffect(() => {
    if (!notification) {
      return;
    }

    const timeout = window.setTimeout(() => dispatch(clearNotification()), 3500);
    return () => window.clearTimeout(timeout);
  }, [dispatch, notification]);

  useEffect(() => {
    if (!user || !accessToken || !refreshToken) {
      return;
    }

    const refreshIfNeeded = () => {
      if (authService.isAccessTokenExpired(accessToken)) {
        void dispatch(refreshAccessToken());
      }
    };

    refreshIfNeeded();
    const interval = window.setInterval(refreshIfNeeded, 10_000);
    return () => window.clearInterval(interval);
  }, [accessToken, dispatch, refreshToken, user]);

  return (
    <>
      <Outlet />
      {isCreateDocumentModalOpen ? <CreateDocumentModal /> : null}
      {notification ? (
        <div className={`toast toast--${notification.kind}`}>{notification.message}</div>
      ) : null}
    </>
  );
}
