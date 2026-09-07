import { Link } from "react-router-dom";
import CartItem from "../../components/cart/CartItem";
import { useCart } from "../../context/CartContext";
import { formatInr } from "../../utils/currency";

export default function CartPage() {
    const { items, totalQuantity, totalPrice, clearCart } = useCart();

    return (
        <main className="min-h-screen bg-slate-100 pb-32">
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white p-4">
                <div className="mx-auto flex max-w-3xl items-center justify-between">
                    <div>
                        <Link
                            to="/"
                            className="text-sm font-semibold text-red-600"
                        >
                            ← Continue Shopping
                        </Link>

                        <h1 className="mt-1 text-2xl font-bold text-slate-900">
                            Your Cart
                        </h1>
                    </div>

                    {items.length > 0 && (
                        <button
                            type="button"
                            onClick={clearCart}
                            className="text-sm font-semibold text-slate-500"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </header>

            <section className="mx-auto max-w-3xl space-y-4 p-4">
                {items.map((item) => (
                    <CartItem
                        key={item.tyre.productId}
                        item={item}
                    />
                ))}

                {items.length === 0 && (
                    <div className="rounded-2xl bg-white p-8 text-center">
                        <h2 className="text-lg font-bold text-slate-900">
                            Your cart is empty
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            Search for a tyre and add it to begin billing.
                        </p>

                        <Link
                            to="/"
                            className="mt-5 inline-block rounded-xl bg-red-600 px-5 py-3 font-semibold text-white"
                        >
                            Find Tyres
                        </Link>
                    </div>
                )}
            </section>

            {items.length > 0 && (
                <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white p-4 shadow-lg">
                    <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
                        <div>
                            <p className="text-sm text-slate-500">
                                {totalQuantity}{" "}
                                {totalQuantity === 1 ? "tyre" : "tyres"}
                            </p>
                            <p className="text-xl font-bold text-slate-900">
                                {formatInr(totalPrice)}
                            </p>
                        </div>

                        <Link
                            to="/cart/services"
                            className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
                        >
                            Add Services
                        </Link>
                    </div>
                </div>
            )}
        </main>
    );
}