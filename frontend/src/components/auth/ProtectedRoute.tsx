import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../types/auth";

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: UserRole[];
    requireStockInPermission?: boolean;
}

export default function ProtectedRoute({
                                           children,
                                           allowedRoles,
                                           requireStockInPermission = false
                                       }: ProtectedRouteProps) {
    const {
        user,
        isLoading
    } = useAuth();

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-100">
                <p className="text-sm font-semibold text-slate-600">
                    Loading...
                </p>
            </main>
        );
    }

    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    if (
        allowedRoles &&
        !allowedRoles.includes(user.role)
    ) {
        return (
            <Navigate
                to={
                    user.role === "ADMIN"
                        ? "/admin"
                        : "/"
                }
                replace
            />
        );
    }

    if (
        requireStockInPermission &&
        !user.canStockIn
    ) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    return children;
}