import { HashRouter, Route, Routes } from "react-router-dom";

import AuthPage from "../features/auth/pages";
import Login from "../features/auth/pages/Login";
import ProtectedRoutes from "./ProtectedRoutes";
import App from "./App";
import Signup from "../features/auth/pages/Signup";
import HomePage from "../features/home/pages";
import SalesLog from "../features/salesLog/pages";

import SO from "../features/salesOrders/pages";
import SODetail from "../features/salesOrders/pages/Detail";

import CategoryPage from "../features/category/pages";
import CategoryDetail from "../features/category/pages/Detail";
import ProductPage from "../features/product/pages";
import ProductDetail from "../features/product/pages/Detail";

import CustomerPage from "../features/customers/pages";
import CustomerDetail from "../features/customers/pages/Detail";

import ProductVerifier from "../features/product/pages/Verifier";
import InventoryPage from "../features/inventory/pages";
import InventoryDetail from "../features/inventory/pages/Detail";

import SalesPage from "../features/sales/pages";
import SalesDetail from "../features/sales/pages/Detail";

import ReturnsPage from "../features/returns/pages";
import ReturnsDetail from "../features/returns/pages/Detail";

import TopProductsPage from "../features/Reports/pages/Top";

import SettingsPage from "../features/settings/pages";
import GeneralPage from "../features/settings/pages/General";
import SettingsSystemPage from "../features/settings/pages/System";

import NotFoundPage from "../features/notFound/pages";

export default function Router() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />}>
          <Route index element={<Login />} />
          <Route path="signup" element={<Signup />} />
        </Route>
        <Route
          path="/"
          element={
            <ProtectedRoutes>
              <App />
            </ProtectedRoutes>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="sales-log" element={<SalesLog />} />

          <Route path="so">
            <Route index element={<SO />} />
            <Route path=":id" element={<SODetail />} />
          </Route>

          <Route path="categories">
            <Route index element={<CategoryPage />} />
            <Route path=":id" element={<CategoryDetail />} />
          </Route>

          <Route path="customers">
            <Route index element={<CustomerPage />} />
            <Route path=":id" element={<CustomerDetail />} />
          </Route>

          <Route path="products">
            <Route index element={<ProductPage />} />
            <Route path=":id" element={<ProductDetail />} />
          </Route>

          <Route path="price-verifier" element={<ProductVerifier />} />

          <Route path="inventory">
            <Route index element={<InventoryPage />} />
            <Route path=":id" element={<InventoryDetail />} />
          </Route>

          <Route path="sales">
            <Route index element={<SalesPage />} />
            <Route path=":id" element={<SalesDetail />} />
          </Route>

          <Route path="returns">
            <Route index element={<ReturnsPage />} />
            <Route path=":id" element={<ReturnsDetail />} />
          </Route>

          <Route path="reports">
            {/* <Route index element={<SalesPage />} /> */}
            <Route path="sales" element={<TopProductsPage />} />
          </Route>

          <Route path="settings" element={<SettingsPage />}>
            <Route index element={<GeneralPage />} />
            <Route path="system" element={<SettingsSystemPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </HashRouter>
  );
}
