import { BrowserRouter, useNavigate, useHref } from "react-router";
import { RouterProvider } from "react-aria-components";
import Router from "./router/Router";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeContext";

const AppRoutes = () => {
  const navigate = useNavigate();
  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
      <Router />
    </RouterProvider>
  );
};

const App = () => (
  <ThemeProvider>
    <CartProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </CartProvider>
  </ThemeProvider>
);

export default App;
