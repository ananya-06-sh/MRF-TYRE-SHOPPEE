import {
    useEffect,
    useMemo,
    useState,
    type FormEvent
} from "react";
import { useNavigate } from "react-router-dom";
import {
    addStock,
    getStaffStockInItems
} from "../../services/stockApi";
import type { StaffStockInItem } from "../../types/adminInventory";

export default function StaffStockInPage() {
    const navigate = useNavigate();

    const [inventory, setInventory] =
        useState<StaffStockInItem[]>([]);

    const [search, setSearch] =
        useState("");

    const [selectedId, setSelectedId] =
        useState("");

    const [quantity, setQuantity] =
        useState("");

    const [supplierName, setSupplierName] =
        useState("");

    const [referenceNumber, setReferenceNumber] =
        useState("");

    const [note, setNote] =
        useState("");

    const [receiptDate, setReceiptDate] =
        useState(
            new Date().toISOString().slice(0, 10)
        );

    const [isLoading, setIsLoading] =
        useState(true);

    const [isSaving, setIsSaving] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [message, setMessage] =
        useState<string | null>(null);

    const selectedItem = inventory.find(
        (item) => item.id === selectedId
    );

    const filteredInventory = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return inventory;
        }

        return inventory.filter((item) =>
            [
                item.productId,
                item.patternAndSize,
                item.billingMatchKey
            ].some((value) =>
                value.toLowerCase().includes(query)
            )
        );
    }, [inventory, search]);

    useEffect(() => {
        async function loadInventory(): Promise<void> {
            try {
                const items =
                    await getStaffStockInItems();

                setInventory(items);
            } catch (requestError: unknown) {
                setError(
                    requestError instanceof Error
                        ? requestError.message
                        : "Unable to load inventory."
                );
            } finally {
                setIsLoading(false);
            }
        }

        void loadInventory();
    }, []);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ): Promise<void> {
        event.preventDefault();
        setError(null);
        setMessage(null);

        if (!selectedItem) {
            setError("Select a tyre.");
            return;
        }

        const numericQuantity = Number(quantity);

        if (
            !Number.isInteger(numericQuantity) ||
            numericQuantity <= 0
        ) {
            setError(
                "Quantity must be a positive whole number."
            );
            return;
        }

        setIsSaving(true);

        try {
            const updatedItem = await addStock({
                inventoryItemId: selectedItem.id,
                quantity: numericQuantity,
                supplierName:
                    supplierName.trim() || undefined,
                referenceNumber:
                    referenceNumber.trim() || undefined,
                note: note.trim() || undefined,
                occurredAt: new Date(
                    `${receiptDate}T12:00:00`
                ).toISOString()
            });

            setInventory((currentInventory) =>
                currentInventory.map((item) =>
                    item.id === updatedItem.id
                        ? {
                            ...item,
                            currentStock:
                            updatedItem.currentStock
                        }
                        : item
                )
            );

            setQuantity("");
            setReferenceNumber("");
            setNote("");

            setMessage(
                `${numericQuantity} tyre(s) added. New stock: ${updatedItem.currentStock}.`
            );
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to add stock."
            );
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-100 p-4">
            <div className="mx-auto max-w-2xl">
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="mb-4 text-sm font-semibold text-red-600"
                >
                    ← Inventory
                </button>

                <h1 className="text-2xl font-bold text-slate-900">
                    Stock-In
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    Record tyres received from a supplier.
                </p>

                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                    Cost and selling prices can only be viewed or changed by Admin.
                </div>

                {message && (
                    <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="mt-6 space-y-4 rounded-2xl bg-white p-5 shadow-sm"
                >
                    <input
                        type="search"
                        placeholder="Search tyre or size"
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-300 px-4 py-3"
                    />

                    <select
                        value={selectedId}
                        onChange={(event) =>
                            setSelectedId(
                                event.target.value
                            )
                        }
                        required
                        disabled={isLoading}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3"
                    >
                        <option value="">
                            {isLoading
                                ? "Loading inventory..."
                                : "Select a tyre"}
                        </option>

                        {filteredInventory.map((item) => (
                            <option
                                key={item.id}
                                value={item.id}
                            >
                                {item.patternAndSize} — Stock{" "}
                                {item.currentStock}
                            </option>
                        ))}
                    </select>

                    {selectedItem && (
                        <div className="rounded-xl bg-slate-100 p-4">
                            <p className="font-bold text-slate-900">
                                {selectedItem.patternAndSize}
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                                Current stock:{" "}
                                {selectedItem.currentStock}
                            </p>
                        </div>
                    )}

                    <input
                        type="number"
                        placeholder="Quantity received"
                        value={quantity}
                        onChange={(event) =>
                            setQuantity(event.target.value)
                        }
                        min={1}
                        step={1}
                        required
                        className="w-full rounded-xl border border-slate-300 px-4 py-3"
                    />

                    <input
                        type="text"
                        placeholder="Supplier name"
                        value={supplierName}
                        onChange={(event) =>
                            setSupplierName(
                                event.target.value
                            )
                        }
                        className="w-full rounded-xl border border-slate-300 px-4 py-3"
                    />

                    <input
                        type="text"
                        placeholder="Supplier invoice number"
                        value={referenceNumber}
                        onChange={(event) =>
                            setReferenceNumber(
                                event.target.value
                            )
                        }
                        className="w-full rounded-xl border border-slate-300 px-4 py-3"
                    />

                    <input
                        type="date"
                        value={receiptDate}
                        onChange={(event) =>
                            setReceiptDate(
                                event.target.value
                            )
                        }
                        required
                        className="w-full rounded-xl border border-slate-300 px-4 py-3"
                    />

                    <textarea
                        placeholder="Optional note"
                        value={note}
                        onChange={(event) =>
                            setNote(event.target.value)
                        }
                        rows={3}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3"
                    />

                    <button
                        type="submit"
                        disabled={
                            isSaving ||
                            isLoading ||
                            !selectedItem
                        }
                        className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white disabled:bg-slate-400"
                    >
                        {isSaving
                            ? "Adding Stock..."
                            : "Confirm Stock-In"}
                    </button>
                </form>
            </div>
        </main>
    );
}