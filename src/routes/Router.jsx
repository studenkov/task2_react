import { Route, Routes } from 'react-router';
import RootLayout from '../layouts/RootLayout';
import HomePage from '../pages/HomePage';
import CartPage from '@/pages/CartPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import AdminPage from '@/pages/AdminPage';

export const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
};

export default Router;
