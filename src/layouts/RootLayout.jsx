import { HeaderNavigationBase } from '@/components/application/app-navigation/header-navigation';
import { Button } from '@/components/base/buttons/button';
import { ButtonUtility } from '@/components/base/buttons/button-utility';
import { ThemeContext } from '@/context/ThemeContext';
import { Moon01, Sun } from '@untitledui/icons';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { Outlet, useNavigate } from 'react-router';

export default function RootLayout() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { session, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const headerItems = [
    { label: 'Главная', href: '/' },
    { label: 'Корзина', href: '/cart' },
    ...(session?.role === 'admin' ?
      [{ label: 'Админ-панель', href: '/admin' }]
    : []),
  ];

  return (
    <>
      <div className="sticky top-0 z-50">
        <HeaderNavigationBase
          items={headerItems}
          actions={
            <div className="flex items-center gap-3">
              <ButtonUtility
                size="xs"
                color="tertiary"
                tooltip="Сменить тему"
                icon={theme === 'light' ? Moon01 : Sun}
                onClick={toggleTheme}
              />

              {session ?
                <Button size="xs" color="secondary" onClick={logout}>
                  Выйти
                </Button>
              : <>
                  <Button
                    size="xs"
                    color="secondary"
                    onClick={() => navigate('/register')}>
                    Регистрация
                  </Button>
                  <Button
                    size="xs"
                    color="primary"
                    onClick={() => navigate('/login')}>
                    Войти
                  </Button>
                </>
              }
            </div>
          }
        />
      </div>
      <main>
        <Outlet />
      </main>
    </>
  );
}
