import { useMemo, useState } from "react";
import ProductCard from "../../components/inventory/ProductCard";
import { mockTyres } from "../../data/mockTyres";
import { getStockStatus } from "../../types/inventory";
import { useCart } from "../../context/CartContext";
import { formatInr } from "../../utils/currency";
import { Link } from "react-router-dom";

export default function StaffDashboardPage() {
    const [searchText, setSearchText] = useState("");
    const { totalQuantity, totalPrice } = useCart();
    const filteredTyres = useMemo(() => {
        const query = searchText.trim().toLowerCase();

        if (!query) {
            return mockTyres;
        }

        return mockTyres.filter((tyre) => {
            const searchableText = [
                tyre.productId,
                tyre.patternAndSize,
                tyre.category,
                ...tyre.compatibleVehicles
            ]
                .join(" ")
                .toLowerCase();

            return searchableText.includes(query);
        });
    }, [searchText]);

    const outOfStockCount = mockTyres.filter(
        (tyre) => getStockStatus(tyre) === "OUT_OF_STOCK"
    ).length;

    const lowStockCount = mockTyres.filter(
        (tyre) => getStockStatus(tyre) === "LOW_STOCK"
    ).length;

    return (
        <main className="min-h-screen bg-slate-100">
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white p-4 shadow-sm">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase text-red-600">
                                MRF Tyre Shop
                            </p>
                            <h1 className="text-xl font-bold text-slate-900">
                                Find a Tyre
                            </h1>
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            Staff
                        </span>
                    </div>

                    <input
                        type="search"
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
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
                    {filteredTyres.length} tyres found
                </p>

                <div className="space-y-4">
                    {filteredTyres.map((tyre) => (
                        <ProductCard
                            key={tyre.productId}
                            tyre={tyre}
                        />
                    ))}
                </div>

                {filteredTyres.length === 0 && (
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
                                {totalQuantity} {totalQuantity === 1 ? "tyre" : "tyres"}
                            </p>
                            <p className="text-lg font-bold text-red-600">
                                {formatInr(totalPrice)}
                            </p>
                        </div>

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