import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logoutUser } from '@/features/auth/authSlice';

function routeTitle(pathname: string, activeDocumentTitle: string | null): string {
  if (pathname.startsWith('/documents/')) {
    return activeDocumentTitle ?? 'Документ';
  }

  if (pathname === '/profile') {
    return 'Профиль';
  }

  return 'Мои документы';
}

export function AppLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const activeDocument = useAppSelector((state) => state.documents.activeDocument);
  const currentTitle = routeTitle(location.pathname, activeDocument?.title ?? null);

  const logout = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  return (
    <div className="layout">
      <aside className="layout-sidebar">
        <Link className="layout-logo" to="/dashboard">
          Spreadsheet
        </Link>
        <nav className="layout-nav" aria-label="Основная навигация">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? 'layout-nav__link is-active' : 'layout-nav__link')}
          >
            Мои документы
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => (isActive ? 'layout-nav__link is-active' : 'layout-nav__link')}
          >
            Профиль
          </NavLink>
        </nav>
      </aside>
      <div className="layout-main">
        <header className="layout-header">
          <div>
            <div className="breadcrumbs" aria-label="Хлебные крошки">
              <Link to="/dashboard">Мои документы</Link>
              {location.pathname.startsWith('/documents/') || location.pathname === '/profile' ? (
                <>
                  <span>→</span>
                  <span>{currentTitle}</span>
                </>
              ) : null}
            </div>
            <h1>{currentTitle}</h1>
          </div>
          {user ? (
            <div className="user-badge">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
              <button type="button" className="link-button" onClick={() => void logout()}>
                Выйти
              </button>
            </div>
          ) : null}
        </header>
        <Outlet />
      </div>
    </div>
  );
}
