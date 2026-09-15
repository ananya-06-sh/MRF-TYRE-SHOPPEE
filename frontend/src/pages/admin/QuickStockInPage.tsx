import {
    useEffect,
    useMemo,
    useState,
    type FormEvent
} from "react";
import { useNavigate } from "react-router-dom";
import {
    addStock,
    getAdminInventory
} from "../../services/stockApi";
import type { AdminInventoryItem } from "../../types/adminInventory";

function formatRupees(paise: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(paise / 100);
}

export default function QuickStockInPage() {
    const navigate = useNavigate();

    const [inventory, setInventory] =
        useState<AdminInventoryItem[]>([]);

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

    const [costUnchanged, setCostUnchanged] =
        useState(true);

    const [newBaseCost, setNewBaseCost] =
        useState("");

    const [newSellingPrice, setNewSellingPrice] =
        useState("");

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
        const normalizedSearch =
            search.trim().toLowerCase();

        if (!normalizedSearch) {
            return inventory;
        }

        return inventory.filter((item) =>
            [
                item.productId,
                item.patternAndSize,
                item.billingMatchKey
            ].some((value) =>
                value
                    .toLowerCase()
                    .includes(normalizedSearch)
            )
        );
    }, [inventory, search]);

    useEffect(() => {
        async function loadInventory(): Promise<void> {
            try {
                const items =
                    await getAdminInventory();

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

    useEffect(() => {
        if (!selectedItem) {
            setNewBaseCost("");
            setNewSellingPrice("");
            return;
        }

        setNewBaseCost(
            String(selectedItem.baseCostPaise / 100)
        );

        setNewSellingPrice(
            String(
                selectedItem.finalSellingPricePaise /
                100
            )
        );
    }, [selectedItem]);

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
                ).toISOString(),
                newBaseCostRupees: costUnchanged
                    ? undefined
                    : Number(newBaseCost),
                newSellingPriceRupees: costUnchanged
                    ? undefined
                    : Number(newSellingPrice)
            });

            setInventory((currentInventory) =>
                currentInventory.map((item) =>
                    item.id === updatedItem.id
                        ? {
                            ...item,
                            currentStock:
                            updatedItem.currentStock,
                            baseCostPaise:
                            updatedItem.baseCostPaise,
                            finalSellingPricePaise:
                            updatedItem.finalSellingPricePaise
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
                    onClick={() => navigate("/admin")}
                    className="mb-4 text-sm font-semibold text-red-600"
                >
                    ← Admin Dashboard
                </button>

                <h1 className="text-2xl font-bold text-slate-900">
                    Quick Stock-In
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    Record tyres received from a supplier.
                </p>

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
                        placeholder="Search tyre, size or billing name"
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
                        <div className="rounded-xl bg-slate-100 p-4 text-sm">
                            <p className="font-bold text-slate-900">
                                {selectedItem.patternAndSize}
                            </p>

                            <p className="mt-1 text-slate-600">
                                Current stock:{" "}
                                {selectedItem.currentStock}
                            </p>

                            <p className="text-slate-600">
                                Base cost:{" "}
                                {formatRupees(
                                    selectedItem.baseCostPaise
                                )}
                            </p>

                            <p className="text-slate-600">
                                Selling price:{" "}
                                {formatRupees(
                                    selectedItem.finalSellingPricePaise
                                )}
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

                    <div>
                        <label className="text-sm font-semibold text-slate-700">
                            Receipt date
                        </label>

                        <input
                            type="date"
                            value={receiptDate}
                            onChange={(event) =>
                                setReceiptDate(
                                    event.target.value
                                )
                            }
                            required
                            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
                        />
                    </div>

                    <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
                        <input
                            type="checkbox"
                            checked={costUnchanged}
                            onChange={(event) =>
                                setCostUnchanged(
                                    event.target.checked
                                )
                            }
                            className="h-5 w-5"
                        />

                        <span className="font-semibold text-slate-700">
                            Cost and selling price remain unchanged
                        </span>
                    </label>

                    {!costUnchanged && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <input
                                type="number"
                                placeholder="New base cost (₹)"
                                value={newBaseCost}
                                onChange={(event) =>
                                    setNewBaseCost(
                                        event.target.value
                                    )
                                }
                                min={0.01}
                                step={0.01}
                                required
                                className="rounded-xl border border-slate-300 px-4 py-3"
                            />

                            <input
                                type="number"
                                placeholder="New selling price (₹)"
                                value={newSellingPrice}
                                onChange={(event) =>
                                    setNewSellingPrice(
                                        event.target.value
                                    )
                                }
                                min={0.01}
                                step={0.01}
                                required
                                className="rounded-xl border border-slate-300 px-4 py-3"
                            />
                        </div>
                    )}

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