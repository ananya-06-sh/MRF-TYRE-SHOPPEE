import { Link } from "react-router-dom";
import ServiceSelector from "../../components/cart/ServiceSelector";
import { useCart } from "../../context/CartContext";
import { formatInr } from "../../utils/currency";

export default function ServiceSelectionPage() {
    const {
        items,
        selectedServices,
        totalPrice
    } = useCart();

    const hasTyres = items.length > 0;
    const hasServices =
        selectedServices.length > 0;

    return (
        <main className="min-h-screen bg-slate-100 pb-32">
            <header className="border-b border-slate-200 bg-white p-4">
                <div className="mx-auto max-w-3xl">
                    <Link
                        to={hasTyres ? "/cart" : "/"}
                        className="text-sm font-semibold text-red-600"
                    >
                        {hasTyres
                            ? "← Back to Cart"
                            : "← Back to Inventory"}
                    </Link>

                    <h1 className="mt-1 text-2xl font-bold text-slate-900">
                        Services
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        {hasTyres
                            ? "Add workshop services to this tyre bill."
                            : "Create a service-only bill without purchasing tyres."}
                    </p>
                </div>
            </header>

            <div className="mx-auto max-w-3xl p-4">
                {!hasTyres && (
                    <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                        <h2 className="font-bold text-blue-900">
                            Service-Only Customer
                        </h2>

                        <p className="mt-1 text-sm text-blue-700">
                            Select one or more services below.
                            No tyre purchase is required.
                        </p>
                    </div>
                )}

                <ServiceSelector />
            </div>

            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white p-4 shadow-lg">
                <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-slate-500">
                            {hasTyres
                                ? "Total with services"
                                : "Service total"}
                        </p>

                        <p className="text-xl font-bold text-slate-900">
                            {formatInr(totalPrice)}
                        </p>

                        {hasServices && (
                            <p className="text-xs text-slate-500">
                                {selectedServices.length}{" "}
                                {selectedServices.length === 1
                                    ? "service"
                                    : "services"}{" "}
                                selected
                            </p>
                        )}
                    </div>

                    {hasTyres || hasServices ? (
                        <Link
                            to="/billing"
                            className="rounded-xl bg-red-600 px-6 py-3 text-center font-semibold text-white hover:bg-red-700"
                        >
                            Continue to Billing
                        </Link>
                    ) : (
                        <button
                            type="button"
                            disabled
                            className="cursor-not-allowed rounded-xl bg-slate-300 px-6 py-3 font-semibold text-slate-500"
                        >
                            Select a Service
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
}