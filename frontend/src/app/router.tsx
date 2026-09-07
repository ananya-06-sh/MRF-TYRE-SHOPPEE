import {
    BrowserRouter,
    Navigate,
    Route,
    Routes
} from "react-router-dom";
import CartPage from "../pages/cart/CartPage";
import StaffDashboardPage from "../pages/dashboard/StaffDashboardPage";
import ServiceSelectionPage from "../pages/cart/ServiceSelectionPage";
import BillingPage from "../pages/billing/BillingPage";

export default function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<StaffDashboardPage />}
                />

                <Route
                    path="/cart"
                    element={<CartPage />}
                />
                <Route
                    path="/cart/services"
                    element={<ServiceSelectionPage />}
                />
                <Route
                    path="/billing"
                    element={<BillingPage />}
                />

                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />
            </Routes>
        </BrowserRouter>
    );
}