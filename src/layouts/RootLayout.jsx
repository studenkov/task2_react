import { HeaderNavigationBase } from "@/components/application/app-navigation/header-navigation";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { ThemeContext } from "@/context/ThemeContext";
import { Moon01, Sun } from "@untitledui/icons";
import { useContext } from "react";
import { Outlet } from "react-router";

export default function RootLayout() {
  const headerItems = [
    { label: "Главная", href: "/" },
    { label: "Корзина", href: "/cart" },
  ];

  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <>
      <div className="sticky top-0 z-50">
        <HeaderNavigationBase
          items={headerItems}
          actions={
            <div>
              <ButtonUtility
                size="xs"
                color="tertiary"
                tooltip="Сменить тему"
                icon={theme === "light" ? Moon01 : Sun}
                onClick={toggleTheme}
              />
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
