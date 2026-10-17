import { createContext, useState } from "react";

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  function toggleTheme() {
    setTheme((prevTheme) => {
      const nextTheme = prevTheme === "light" ? "dark" : "light";

      document.documentElement.classList.toggle(
        "dark-mode",
        nextTheme === "dark",
      );

      return nextTheme;
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
