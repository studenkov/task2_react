import { Route, Routes } from "react-router";
import RootLayout from "../layouts/RootLayout";
import HomePage from "../pages/HomePage";
import CartPage from "@/pages/CartPage";

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<HomePage />} />
        <Route path="cart" element={<CartPage />} />
        <Route
          path="dashboard"
          element={
            <div className="mx-auto max-w-container prose">
              <h1 className="p-8">Dashboard</h1>
            </div>
          }
        />
      </Route>
    </Routes>
  );
};

export default Router;
