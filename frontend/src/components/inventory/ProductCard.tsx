import {
    getStockStatus,
    type StaffTyre
} from "../../types/inventory";
import { formatInr } from "../../utils/currency";
import { useCart } from "../../context/CartContext";

interface ProductCardProps {
    tyre: StaffTyre;
}

const stockStyles = {
    IN_STOCK: "bg-emerald-100 text-emerald-700",
    LOW_STOCK: "bg-amber-100 text-amber-700",
    OUT_OF_STOCK: "bg-red-100 text-red-700"
};

const stockLabels = {
    IN_STOCK: "In Stock",
    LOW_STOCK: "Low Stock",
    OUT_OF_STOCK: "Out of Stock"
};

export default function ProductCard({ tyre }: ProductCardProps) {
    const stockStatus = getStockStatus(tyre);
    const { addItem } = useCart();
    const isOutOfStock = stockStatus === "OUT_OF_STOCK";

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase text-red-600">
                        {tyre.category}
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-slate-900">
                        {tyre.patternAndSize}
                    </h2>
                </div>

                <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${stockStyles[stockStatus]}`}
                >
                    {stockLabels[stockStatus]}
                </span>
            </div>

            <p className="mt-3 text-sm text-slate-500">
                Fits: {tyre.compatibleVehicles.join(", ")}
            </p>

            <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                    <p className="text-2xl font-bold text-slate-900">
                        {formatInr(tyre.finalSellingPrice)}
                    </p>
                    <p className="text-xs text-slate-500">
                        Inclusive of tax
                    </p>
                </div>

                <div className="text-right">
                    <p className="text-sm font-semibold text-slate-700">
                        {tyre.currentStock} available
                    </p>
                    <p className="text-xs text-slate-500">
                        Product: {tyre.productId}
                    </p>
                </div>
            </div>

            <button
                type="button"
                onClick={() => addItem(tyre)}
                disabled={isOutOfStock}
                className="mt-4 w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
                {isOutOfStock ? "Unavailable" : "Add to Cart"}
            </button>
        </article>
    );
}