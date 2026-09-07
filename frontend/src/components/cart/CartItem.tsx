import { useCart } from "../../context/CartContext";
import type { CartItem as CartItemType } from "../../types/order";
import { formatInr } from "../../utils/currency";

interface CartItemProps {
    item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
    const { updateQuantity, removeItem } = useCart();
    const { tyre, quantity } = item;

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="font-bold text-slate-900">
                        {tyre.patternAndSize}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        {formatInr(tyre.finalSellingPrice)} each
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => removeItem(tyre.productId)}
                    className="text-sm font-semibold text-red-600"
                >
                    Remove
                </button>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center rounded-xl border border-slate-300">
                    <button
                        type="button"
                        onClick={() =>
                            updateQuantity(tyre.productId, quantity - 1)
                        }
                        disabled={quantity <= 1}
                        className="h-11 w-11 text-xl font-bold disabled:text-slate-300"
                    >
                        −
                    </button>

                    <span className="min-w-10 text-center font-bold">
                        {quantity}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            updateQuantity(tyre.productId, quantity + 1)
                        }
                        disabled={quantity >= tyre.currentStock}
                        className="h-11 w-11 text-xl font-bold disabled:text-slate-300"
                    >
                        +
                    </button>
                </div>

                <p className="text-lg font-bold text-slate-900">
                    {formatInr(tyre.finalSellingPrice * quantity)}
                </p>
            </div>
        </article>
    );
}