import {
    BrowserRouter,
    Navigate,
    Route,
    Routes
} from "react-router-dom";

import ProtectedRoute from "../components/auth/ProtectedRoute";
import AccountSettingsPage from "../pages/account/AccountSettingsPage";
import AdminInventoryPage from "../pages/admin/AdminInventoryPage";
import InventoryFormPage from "../pages/admin/InventoryFormPage";
import QuickStockInPage from "../pages/admin/QuickStockInPage";
import StaffAccountsPage from "../pages/admin/StaffAccountsPage";
import LoginPage from "../pages/auth/LoginPage";
import BillingPage from "../pages/billing/BillingPage";
import CartPage from "../pages/cart/CartPage";
import ServiceSelectionPage from "../pages/cart/ServiceSelectionPage";
import AdminDashboardPage from "../pages/dashboard/AdminDashboardPage";
import StaffDashboardPage from "../pages/dashboard/StaffDashboardPage";
import StaffStockInPage from "../pages/stock/StaffStockInPage";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/login"
                    element={<LoginPage />}
                />

                <Route
                    path="/"
                    element={
                        <ProtectedRoute
                            allowedRoles={["ADMIN", "STAFF"]}
                        >
                            <StaffDashboardPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute
                            allowedRoles={["ADMIN"]}
                        >
                            <AdminDashboardPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/inventory"
                    element={
                        <ProtectedRoute
                            allowedRoles={["ADMIN"]}
                        >
                            <AdminInventoryPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/inventory/new"
                    element={
                        <ProtectedRoute
                            allowedRoles={["ADMIN"]}
                        >
                            <InventoryFormPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/inventory/:inventoryItemId/edit"
                    element={
                        <ProtectedRoute
                            allowedRoles={["ADMIN"]}
                        >
                            <InventoryFormPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/stock-in"
                    element={
                        <ProtectedRoute
                            allowedRoles={["ADMIN"]}
                        >
                            <QuickStockInPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/stock-in"
                    element={
                        <ProtectedRoute
                            allowedRoles={["ADMIN", "STAFF"]}
                            requireStockInPermission
                        >
                            <StaffStockInPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admin/staff"
                    element={
                        <ProtectedRoute
                            allowedRoles={["ADMIN"]}
                        >
                            <StaffAccountsPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/account"
                    element={
                        <ProtectedRoute
                            allowedRoles={["ADMIN", "STAFF"]}
                        >
                            <AccountSettingsPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/cart"
                    element={
                        <ProtectedRoute
                            allowedRoles={["ADMIN", "STAFF"]}
                        >
                            <CartPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/cart/services"
                    element={
                        <ProtectedRoute
                            allowedRoles={["ADMIN", "STAFF"]}
                        >
                            <ServiceSelectionPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/billing"
                    element={
                        <ProtectedRoute
                            allowedRoles={["ADMIN", "STAFF"]}
                        >
                            <BillingPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />
            </Routes>
        </BrowserRouter>
    );
}