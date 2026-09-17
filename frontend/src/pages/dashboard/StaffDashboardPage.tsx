import { useState } from "react";
import {
    Link,
    useNavigate
} from "react-router-dom";
import ProductCard from "../../components/inventory/ProductCard";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useCatalogueSearch } from "../../hooks/useCatalogueSearch";
import { getStockStatus } from "../../types/inventory";
import { formatInr } from "../../utils/currency";

export default function StaffDashboardPage() {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    const [searchText, setSearchText] =
        useState("");

    const {
        totalQuantity,
        totalPrice
    } = useCart();

    const {
        tyres: allTyres
    } = useCatalogueSearch("");

    const {
        tyres: filteredTyres,
        isLoading,
        errorMessage
    } = useCatalogueSearch(searchText);

    const outOfStockCount = allTyres.filter(
        (tyre) =>
            getStockStatus(tyre) === "OUT_OF_STOCK"
    ).length;

    const lowStockCount = allTyres.filter(
        (tyre) =>
            getStockStatus(tyre) === "LOW_STOCK"
    ).length;

    async function handleLogout(): Promise<void> {
        await signOut();

        navigate("/login", {
            replace: true
        });
    }

    return (
        <main className="min-h-screen bg-slate-100">
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white p-4 shadow-sm">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase text-red-600">
                                MRF Tyre Shop
                            </p>

                            <h1 className="text-xl font-bold text-slate-900">
                                Find a Tyre
                            </h1>

                            <p className="text-xs text-slate-500">
                                {user?.displayName}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                {user?.role === "ADMIN"
                                    ? "Admin"
                                    : "Staff"}
                            </span>

                            {user?.role === "ADMIN" && (
                                <Link
                                    to="/admin"
                                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"
                                >
                                    Admin
                                </Link>
                            )}

                            <Link
                                to="/account"
                                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
                            >
                                Account
                            </Link>

                            <Link
                                to="/services"
                                className="rounded-lg border border-blue-300 px-3 py-2 text-xs font-semibold text-blue-700"
                            >
                                Services
                            </Link>

                            <button
                                type="button"
                                onClick={() => {
                                    void handleLogout();
                                }}
                                className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                            >
                                Logout
                            </button>
                        </div>
                    </div>

                    <input
                        type="search"
                        value={searchText}
                        onChange={(event) =>
                            setSearchText(
                                event.target.value
                            )
                        }
                        placeholder="Search Activa, Swift, 165/80 R14..."
                        className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                </div>
            </header>

            <section className="mx-auto max-w-3xl p-4 pb-28">
                <div className="mb-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                        <p className="text-2xl font-bold text-red-700">
                            {outOfStockCount}
                        </p>

                        <p className="text-sm font-medium text-red-700">
                            Out of Stock
                        </p>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <p className="text-2xl font-bold text-amber-700">
                            {lowStockCount}
                        </p>

                        <p className="text-sm font-medium text-amber-700">
                            Low Stock
                        </p>
                    </div>
                </div>

                <p className="mb-3 text-sm font-semibold text-slate-600">
                    {isLoading
                        ? "Searching inventory..."
                        : `${filteredTyres.length} tyres found`}
                </p>

                {isLoading && (
                    <div className="rounded-2xl bg-white p-6 text-center text-slate-500">
                        Loading tyres...
                    </div>
                )}

                {errorMessage && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                        {errorMessage}
                    </div>
                )}

                {!isLoading && !errorMessage && (
                    <div className="space-y-4">
                        {filteredTyres.map((tyre) => (
                            <ProductCard
                                key={tyre.productId}
                                tyre={tyre}
                            />
                        ))}
                    </div>
                )}

                {!isLoading &&
                    !errorMessage &&
                    filteredTyres.length === 0 && (
                        <div className="rounded-2xl bg-white p-8 text-center">
                            <h2 className="font-bold text-slate-900">
                                No matching tyre found
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                Try searching by vehicle name or tyre size.
                            </p>
                        </div>
                    )}
            </section>

            {totalQuantity > 0 && (
                <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white p-4 shadow-lg">
                    <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">
                                {totalQuantity}{" "}
                                {totalQuantity === 1
                                    ? "tyre"
                                    : "tyres"}
                            </p>

                            <p className="text-lg font-bold text-red-600">
                                {formatInr(totalPrice)}
                            </p>
                        </div>
                        {user?.canStockIn && (
                            <Link
                                to={
                                    user.role === "ADMIN"
                                        ? "/admin/stock-in"
                                        : "/stock-in"
                                }
                                className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white"
                            >
                                Stock-In
                            </Link>
                        )}

                        <Link
                            to="/cart"
                            className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
                        >
                            View Cart
                        </Link>
                    </div>
                </div>
            )}
        </main>
    );
}