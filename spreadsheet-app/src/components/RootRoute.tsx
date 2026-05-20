import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { CreateDocumentModal } from '@/features/documents/CreateDocumentModal';
import { clearNotification } from '@/features/ui/uiSlice';

export function RootRoute() {
  const dispatch = useAppDispatch();
  const isCreateDocumentModalOpen = useAppSelector((state) => state.ui.isCreateDocumentModalOpen);
  const notification = useAppSelector((state) => state.ui.notification);
  const saveStatus = useAppSelector((state) => state.documents.saveStatus);

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
