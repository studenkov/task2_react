import { HeaderNavigationBase } from "@/components/application/app-navigation/header-navigation";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { ThemeContext } from "@/context/ThemeContext";
import { Moon01, Sun } from "@untitledui/icons";
import { useContext } from "react";
import { Outlet, useNavigate } from "react-router";

export default function RootLayout() {
  const headerItems = [
    { label: "Главная", href: "/" },
    { label: "Корзина", href: "/cart" },
  ];

  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  function HandleLogin() {
    const isAuth = true;

    if (isAuth) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  }

  return (
    <>
      <div className="sticky top-0 z-50">
        <HeaderNavigationBase
          items={headerItems}
          actions={
            <div className="flex items-center gap-4">
              <ButtonUtility
                size="xs"
                color="tertiary"
                tooltip="Сменить тему"
                icon={theme === "light" ? Moon01 : Sun}
                onClick={toggleTheme}
              />
              <Button size="xs" color="primary" onClick={HandleLogin}>
                Войти
              </Button>
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
