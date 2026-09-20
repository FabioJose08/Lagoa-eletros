import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { AdminLayout } from '@/layouts/AdminLayout';
import { PublicLayout } from '@/layouts/PublicLayout';
import { AccountPage } from '@/pages/AccountPage';
import { LoginPage, RegisterPage } from '@/pages/AuthPages';
import { CartPage } from '@/pages/CartPage';
import { CategoriesPage, CategoryPage, OffersPage, ProductsPage } from '@/pages/CatalogPages';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { HomePage } from '@/pages/HomePage';
import { AboutPage, LocationPage } from '@/pages/InfoPages';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { ProductPage } from '@/pages/ProductPage';
import { AdminRoute } from './AdminRoute';
import { ProtectedRoute } from './ProtectedRoute';

/* O painel é carregado sob demanda: o cliente da loja nunca baixa o código do administrador. */
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })));
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ProductsAdminPage = lazy(() => import('@/pages/admin/ProductsAdminPage').then((m) => ({ default: m.ProductsAdminPage })));
const ProductFormPage = lazy(() => import('@/pages/admin/ProductFormPage').then((m) => ({ default: m.ProductFormPage })));
const OrdersAdminPage = lazy(() => import('@/pages/admin/OrdersAdminPage').then((m) => ({ default: m.OrdersAdminPage })));
const CategoriesAdminPage = lazy(() => import('@/pages/admin/CategoriesAdminPage').then((m) => ({ default: m.CategoriesAdminPage })));
const BrandsAdminPage = lazy(() => import('@/pages/admin/BrandsAdminPage').then((m) => ({ default: m.BrandsAdminPage })));
const PromotionsAdminPage = lazy(() => import('@/pages/admin/PromotionsAdminPage').then((m) => ({ default: m.PromotionsAdminPage })));
const UsersAdminPage = lazy(() => import('@/pages/admin/UsersAdminPage').then((m) => ({ default: m.UsersAdminPage })));

export function AppRoutes(): JSX.Element {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* ÁREA DO CLIENTE */}
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:slug" element={<ProductPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="categories/:slug" element={<CategoryPage />} />
          <Route path="offers" element={<OffersPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="location" element={<LocationPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="account" element={<AccountPage />} />
            <Route path="orders" element={<OrdersPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* ÁREA ADMINISTRATIVA (layout totalmente separado) */}
        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route path="admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="products" element={<ProductsAdminPage />} />
            <Route path="products/new" element={<ProductFormPage />} />
            <Route path="products/:id/edit" element={<ProductFormPage />} />
            <Route path="orders" element={<OrdersAdminPage />} />
            <Route path="categories" element={<CategoriesAdminPage />} />
            <Route path="brands" element={<BrandsAdminPage />} />
            <Route path="promotions" element={<PromotionsAdminPage />} />
            <Route path="users" element={<UsersAdminPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
