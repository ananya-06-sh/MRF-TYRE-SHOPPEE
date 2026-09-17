import {
    useEffect,
    useMemo,
    useState,
    type FormEvent
} from "react";
import {
    useNavigate,
    useParams
} from "react-router-dom";
import {
    createInventoryItem,
    getAdminInventoryItems,
    updateInventoryItem
} from "../../services/adminInventoryApi";
import type { AdminTyreCategory } from "../../types/adminInventory";

export default function InventoryFormPage() {
    const navigate = useNavigate();

    const { inventoryItemId } =
        useParams<{
            inventoryItemId: string;
        }>();

    const isEditing =
        inventoryItemId !== undefined;

    const [productId, setProductId] =
        useState("");

    const [billingMatchKey, setBillingMatchKey] =
        useState("");

    const [patternAndSize, setPatternAndSize] =
        useState("");

    const [normalizedSize, setNormalizedSize] =
        useState("");

    const [category, setCategory] =
        useState<AdminTyreCategory>(
            "TWO_WHEELER"
        );

    const [
        compatibleVehiclesText,
        setCompatibleVehiclesText
    ] = useState("");

    const [openingStock, setOpeningStock] =
        useState("0");

    const [lowStockTrigger, setLowStockTrigger] =
        useState("4");

    const [baseCostRupees, setBaseCostRupees] =
        useState("");

    const [
        finalSellingPriceRupees,
        setFinalSellingPriceRupees
    ] = useState("");

    const [isLoading, setIsLoading] =
        useState(isEditing);

    const [isSaving, setIsSaving] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const baseCostNumber =
        Number(baseCostRupees) || 0;

    const sellingPriceNumber =
        Number(finalSellingPriceRupees) || 0;

    const totalCostNumber = useMemo(
        () => baseCostNumber * 1.28,
        [baseCostNumber]
    );

    const profitNumber =
        sellingPriceNumber - totalCostNumber;

    useEffect(() => {
        if (!inventoryItemId) {
            return;
        }

        async function loadItem(): Promise<void> {
            try {
                const items =
                    await getAdminInventoryItems();

                const item = items.find(
                    (inventoryItem) =>
                        inventoryItem.id ===
                        inventoryItemId
                );

                if (!item) {
                    setError("Tyre was not found.");
                    return;
                }

                setProductId(item.productId);
                setBillingMatchKey(
                    item.billingMatchKey
                );
                setPatternAndSize(
                    item.patternAndSize
                );
                setNormalizedSize(
                    item.normalizedSize
                );
                setCategory(item.category);
                setCompatibleVehiclesText(
                    item.compatibleVehicles.join(", ")
                );
                setLowStockTrigger(
                    String(item.lowStockTrigger)
                );
                setBaseCostRupees(
                    String(item.baseCostPaise / 100)
                );
                setFinalSellingPriceRupees(
                    String(
                        item.finalSellingPricePaise /
                        100
                    )
                );
            } catch (requestError: unknown) {
                setError(
                    requestError instanceof Error
                        ? requestError.message
                        : "Unable to load tyre."
                );
            } finally {
                setIsLoading(false);
            }
        }

        void loadItem();
    }, [inventoryItemId]);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ): Promise<void> {
        event.preventDefault();
        setError(null);
        setIsSaving(true);

        const compatibleVehicles =
            compatibleVehiclesText
                .split(",")
                .map((vehicle) => vehicle.trim())
                .filter(
                    (vehicle) =>
                        vehicle.length > 0
                );

        const commonInput = {
            billingMatchKey,
            patternAndSize,
            normalizedSize,
            category,
            compatibleVehicles,
            lowStockTrigger:
                Number(lowStockTrigger),
            baseCostRupees:
                Number(baseCostRupees),
            finalSellingPriceRupees:
                Number(
                    finalSellingPriceRupees
                )
        };

        try {
            if (inventoryItemId) {
                await updateInventoryItem(
                    inventoryItemId,
                    commonInput
                );
            } else {
                await createInventoryItem({
                    ...commonInput,
                    productId,
                    openingStock:
                        Number(openingStock)
                });
            }

            navigate("/admin/inventory", {
                replace: true
            });
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to save tyre."
            );
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-100">
                <p className="text-slate-600">
                    Loading tyre...
                </p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-100 p-4">
            <div className="mx-auto max-w-2xl">
                <button
                    type="button"
                    onClick={() =>
                        navigate("/admin/inventory")
                    }
                    className="mb-4 text-sm font-semibold text-red-600"
                >
                    ← Inventory Management
                </button>

                <h1 className="text-2xl font-bold text-slate-900">
                    {isEditing
                        ? "Edit Tyre"
                        : "Add New Tyre"}
                </h1>

                {error && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="mt-6 space-y-4 rounded-2xl bg-white p-5 shadow-sm"
                >
                    <div>
                        <label className="text-sm font-semibold text-slate-700">
                            Product ID
                        </label>

                        <input
                            value={productId}
                            onChange={(event) =>
                                setProductId(
                                    event.target.value
                                )
                            }
                            disabled={isEditing}
                            required
                            placeholder="MRF-006"
                            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 disabled:bg-slate-100"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700">
                            Tally/Billing Match Key
                        </label>

                        <input
                            value={billingMatchKey}
                            onChange={(event) =>
                                setBillingMatchKey(
                                    event.target.value
                                )
                            }
                            required
                            placeholder="Exact product name used in Tally"
                            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700">
                            Tyre Pattern and Size
                        </label>

                        <input
                            value={patternAndSize}
                            onChange={(event) =>
                                setPatternAndSize(
                                    event.target.value
                                )
                            }
                            required
                            placeholder="MRF ZVTV 165/80 R14"
                            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700">
                            Searchable Size
                        </label>

                        <input
                            value={normalizedSize}
                            onChange={(event) =>
                                setNormalizedSize(
                                    event.target.value
                                )
                            }
                            required
                            placeholder="165/80 R14"
                            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700">
                            Category
                        </label>

                        <select
                            value={category}
                            onChange={(event) =>
                                setCategory(
                                    event.target
                                        .value as AdminTyreCategory
                                )
                            }
                            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
                        >
                            <option value="TWO_WHEELER">
                                Two-Wheeler
                            </option>

                            <option value="PASSENGER_CAR">
                                Passenger Car
                            </option>

                            <option value="COMMERCIAL">
                                Commercial
                            </option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700">
                            Compatible Vehicles
                        </label>

                        <input
                            value={compatibleVehiclesText}
                            onChange={(event) =>
                                setCompatibleVehiclesText(
                                    event.target.value
                                )
                            }
                            placeholder="Swift, WagonR, Ritz"
                            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
                        />

                        <p className="mt-1 text-xs text-slate-500">
                            Separate vehicle names with commas.
                        </p>
                    </div>

                    {!isEditing && (
                        <div>
                            <label className="text-sm font-semibold text-slate-700">
                                Opening Stock
                            </label>

                            <input
                                type="number"
                                value={openingStock}
                                onChange={(event) =>
                                    setOpeningStock(
                                        event.target.value
                                    )
                                }
                                min={0}
                                step={1}
                                required
                                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
                            />
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-semibold text-slate-700">
                            Low-Stock Trigger
                        </label>

                        <input
                            type="number"
                            value={lowStockTrigger}
                            onChange={(event) =>
                                setLowStockTrigger(
                                    event.target.value
                                )
                            }
                            min={0}
                            step={1}
                            required
                            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="text-sm font-semibold text-slate-700">
                                Base Cost Before GST
                            </label>

                            <input
                                type="number"
                                value={baseCostRupees}
                                onChange={(event) =>
                                    setBaseCostRupees(
                                        event.target.value
                                    )
                                }
                                min={0.01}
                                step={0.01}
                                required
                                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-slate-700">
                                Final Selling Price
                            </label>

                            <input
                                type="number"
                                value={
                                    finalSellingPriceRupees
                                }
                                onChange={(event) =>
                                    setFinalSellingPriceRupees(
                                        event.target.value
                                    )
                                }
                                min={0.01}
                                step={0.01}
                                required
                                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
                            />
                        </div>
                    </div>

                    <div className="rounded-xl bg-slate-100 p-4 text-sm">
                        <p>
                            Cost after 28% GST:{" "}
                            <strong>
                                ₹
                                {totalCostNumber.toFixed(
                                    2
                                )}
                            </strong>
                        </p>

                        <p
                            className={
                                profitNumber >= 0
                                    ? "mt-1 text-green-700"
                                    : "mt-1 text-red-700"
                            }
                        >
                            Estimated profit:{" "}
                            <strong>
                                ₹
                                {profitNumber.toFixed(2)}
                            </strong>
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white disabled:bg-slate-400"
                    >
                        {isSaving
                            ? "Saving..."
                            : isEditing
                                ? "Save Changes"
                                : "Create Tyre"}
                    </button>
                </form>
            </div>
        </main>
    );
}