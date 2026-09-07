import { Link } from "react-router-dom";
import ServiceSelector from "../../components/cart/ServiceSelector";
import { useCart } from "../../context/CartContext";
import { formatInr } from "../../utils/currency";

export default function ServiceSelectionPage() {
    const { items, selectedService, totalPrice } = useCart();

    if (items.length === 0) {
        return (
            <main className="min-h-screen bg-slate-100 p-4">
                <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center">
                    <h1 className="text-xl font-bold text-slate-900">
                        Your cart is empty
                    </h1>

                    <Link
                        to="/"
                        className="mt-5 inline-block rounded-xl bg-red-600 px-5 py-3 font-semibold text-white"
                    >
                        Find Tyres
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-100 pb-32">
            <header className="border-b border-slate-200 bg-white p-4">
                <div className="mx-auto max-w-3xl">
                    <Link
                        to="/cart"
                        className="text-sm font-semibold text-red-600"
                    >
                        ← Back to Cart
                    </Link>

                    <h1 className="mt-1 text-2xl font-bold text-slate-900">
                        Services
                    </h1>
                </div>
            </header>

            <div className="mx-auto max-w-3xl p-4">
                <ServiceSelector />
            </div>

            <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white p-4 shadow-lg">
                <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-slate-500">
                            Total with service
                        </p>

                        <p className="text-xl font-bold text-slate-900">
                            {formatInr(totalPrice)}
                        </p>
                    </div>

                    <Link
                        to="/billing"
                        className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white"
                    >
                        {selectedService
                            ? "Continue to Billing"
                            : "Continue Without Service"}
                    </Link>
                </div>
            </div>
        </main>
    );
}