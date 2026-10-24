import { BrowserRouter, useNavigate, useHref } from 'react-router';
import { RouterProvider } from 'react-aria-components';
import { Router } from './routes/Router';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

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
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
);

export default App;
