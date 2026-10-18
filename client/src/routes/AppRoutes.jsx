import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";
import ProtectedRoute from "./ProtectedRoute";
import GuestRoute from "./GuestRoute";
import HomePage from "../pages/home/HomePage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ProfilePage from "../pages/profile/ProfilePage";
import MatchingPage from "../pages/matching/MatchingPage";
import MatchDetailPage from "../pages/matching/MatchDetailPage";
import ConnectionsPage from "../pages/connections/ConnectionsPage";
import MessagesPage from "../pages/messages/MessagesPage";
import AccommodationListPage from "../pages/accommodation/AccommodationListPage";
import AccommodationDetailPage from "../pages/accommodation/AccommodationDetailPage";
import AccommodationFormPage from "../pages/accommodation/AccommodationFormPage";
import MyListingsPage from "../pages/accommodation/MyListingsPage";
import PassListPage from "../pages/pass/PassListPage";
import PassDetailPage from "../pages/pass/PassDetailPage";
import PassFormPage from "../pages/pass/PassFormPage";
import MyPassPage from "../pages/pass/MyPassPage";
import FavoritesPage from "../pages/favorites/FavoritesPage";
import PricingPage from "../pages/billing/PricingPage";
import CheckoutPage from "../pages/billing/CheckoutPage";
import BillingPage from "../pages/billing/BillingPage";
import HelpPage from "../pages/support/HelpPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminModerationPage from "../pages/admin/AdminModerationPage";
import AdminReportsPage from "../pages/admin/AdminReportsPage";
import AdminPlansPage from "../pages/admin/AdminPlansPage";
import AdminFaqsPage from "../pages/admin/AdminFaqsPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Công khai */}
        <Route path="/" element={<HomePage />} />
        <Route path="/accommodation" element={<AccommodationListPage />} />
        <Route path="/accommodation/:id" element={<AccommodationDetailPage />} />
        <Route path="/pass" element={<PassListPage />} />
        <Route path="/pass/:id" element={<PassDetailPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/help" element={<HelpPage />} />

        {/* Chỉ cho người chưa đăng nhập */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Cần đăng nhập */}
        <Route element={<ProtectedRoute />}>
          <Route path="/matching" element={<MatchingPage />} />
          <Route path="/matching/:userId" element={<MatchDetailPage />} />
          <Route path="/connections" element={<ConnectionsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:conversationId" element={<MessagesPage />} />
          <Route path="/accommodation/new" element={<AccommodationFormPage />} />
          <Route path="/accommodation/:id/edit" element={<AccommodationFormPage />} />
          <Route path="/my-listings" element={<MyListingsPage />} />
          <Route path="/pass/new" element={<PassFormPage />} />
          <Route path="/pass/:id/edit" element={<PassFormPage />} />
          <Route path="/my-pass" element={<MyPassPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/checkout/:planCode" element={<CheckoutPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Chỉ admin */}
        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="moderation" element={<AdminModerationPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="plans" element={<AdminPlansPage />} />
            <Route path="faqs" element={<AdminFaqsPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}