import {
    useEffect,
    useMemo,
    useState
} from "react";
import {
    Link,
    useNavigate
} from "react-router-dom";
import {
    changeInventoryActiveStatus,
    getAdminInventoryItems
} from "../../services/adminInventoryApi";
import type { AdminInventoryItem } from "../../types/adminInventory";

function formatRupees(paise: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(paise / 100);
}

type InventoryStatusFilter =
    | "ACTIVE"
    | "INACTIVE"
    | "ALL";

export default function AdminInventoryPage() {
    const navigate = useNavigate();

    const [inventory, setInventory] =
        useState<AdminInventoryItem[]>([]);

    const [search, setSearch] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState<InventoryStatusFilter>(
            "ACTIVE"
        );

    const [isLoading, setIsLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const [message, setMessage] =
        useState<string | null>(null);

    const filteredInventory = useMemo(() => {
        const query = search.trim().toLowerCase();

        const inventoryByStatus =
            inventory.filter((item) => {
                if (statusFilter === "ALL") {
                    return true;
                }

                return statusFilter === "ACTIVE"
                    ? item.isActive
                    : !item.isActive;
            });

        if (!query) {
            return inventoryByStatus;
        }

        return inventoryByStatus.filter((item) =>
            [
                item.productId,
                item.patternAndSize,
                item.billingMatchKey,
                item.normalizedSize,
                ...item.compatibleVehicles
            ].some((value) =>
                value.toLowerCase().includes(query)
            )
        );
    }, [inventory, search, statusFilter]);

    const activeCount = inventory.filter(
        (item) => item.isActive
    ).length;

    const inactiveCount =
        inventory.length - activeCount;

    async function loadInventory(): Promise<void> {
        setIsLoading(true);
        setError(null);

        try {
            const items =
                await getAdminInventoryItems();

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

    useEffect(() => {
        void loadInventory();
    }, []);

    async function handleStatusChange(
        item: AdminInventoryItem
    ): Promise<void> {
        const nextIsActive =
            !item.isActive;

        const confirmed = window.confirm(
            nextIsActive
                ? `Enable ${item.patternAndSize}? It will appear in Staff search and Stock-In again.`
                : `Disable ${item.patternAndSize}? It will be hidden from Staff search and Stock-In, but its data and history will be preserved.`
        );

        if (!confirmed) {
            return;
        }

        setError(null);
        setMessage(null);

        try {
            await changeInventoryActiveStatus(
                item.id,
                nextIsActive
            );

            setInventory((currentInventory) =>
                currentInventory.map(
                    (currentItem) =>
                        currentItem.id === item.id
                            ? {
                                ...currentItem,
                                isActive:
                                nextIsActive
                            }
                            : currentItem
                )
            );

            setMessage(
                `${item.patternAndSize} was ${
                    nextIsActive
                        ? "enabled"
                        : "disabled"
                }.`
            );
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to change tyre status."
            );
        }
    }

    return (
        <main className="min-h-screen bg-slate-100 p-4">
            <div className="mx-auto max-w-6xl">
                <button
                    type="button"
                    onClick={() => navigate("/admin")}
                    className="mb-4 text-sm font-semibold text-red-600"
                >
                    ← Admin Dashboard
                </button>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Inventory Management
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Manage products, prices and stock warnings.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            to="/admin/inventory/import"
                            className="rounded-xl border border-red-300 bg-white px-4 py-3 font-semibold text-red-600 hover:bg-red-50"
                        >
                            Import CSV
                        </Link>

                        <Link
                            to="/admin/inventory/new"
                            className="rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
                        >
                            Add New Tyre
                        </Link>
                    </div>
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

                <input
                    type="search"
                    placeholder="Search product, size, vehicle or Tally name"
                    value={search}
                    onChange={(event) =>
                        setSearch(event.target.value)
                    }
                    className="mt-6 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                />

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-white p-2 shadow-sm">
                    <button
                        type="button"
                        onClick={() =>
                            setStatusFilter("ACTIVE")
                        }
                        className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                            statusFilter === "ACTIVE"
                                ? "bg-green-600 text-white"
                                : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                        Active ({activeCount})
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setStatusFilter("INACTIVE")
                        }
                        className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                            statusFilter === "INACTIVE"
                                ? "bg-slate-700 text-white"
                                : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                        Disabled ({inactiveCount})
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setStatusFilter("ALL")
                        }
                        className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                            statusFilter === "ALL"
                                ? "bg-red-600 text-white"
                                : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                        All ({inventory.length})
                    </button>
                </div>

                <p className="my-4 text-sm font-semibold text-slate-600">
                    {isLoading
                        ? "Loading inventory..."
                        : `${filteredInventory.length} ${
                            statusFilter === "ACTIVE"
                                ? "active"
                                : statusFilter === "INACTIVE"
                                    ? "disabled"
                                    : "total"
                        } tyre(s)`}
                </p>

                <section className="grid gap-4 lg:grid-cols-2">
                    {filteredInventory.map((item) => (
                        <article
                            key={item.id}
                            className={`rounded-2xl bg-white p-5 shadow-sm ${
                                item.isActive
                                    ? ""
                                    : "border border-slate-300 opacity-75"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold text-red-600">
                                        {item.productId}
                                    </p>

                                    <h2 className="font-bold text-slate-900">
                                        {item.patternAndSize}
                                    </h2>

                                    <p className="text-sm text-slate-500">
                                        {item.billingMatchKey}
                                    </p>

                                    {!item.isActive && (
                                        <span className="mt-2 inline-block rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                                            Disabled
                                        </span>
                                    )}
                                </div>

                                <span
                                    className={
                                        item.currentStock === 0
                                            ? "rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700"
                                            : item.currentStock <=
                                            item.lowStockTrigger
                                                ? "rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700"
                                                : "rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700"
                                    }
                                >
                                    Stock {item.currentStock}
                                </span>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-slate-500">
                                        Base cost
                                    </p>

                                    <p className="font-semibold text-slate-900">
                                        {formatRupees(
                                            item.baseCostPaise
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-slate-500">
                                        Cost with GST
                                    </p>

                                    <p className="font-semibold text-slate-900">
                                        {formatRupees(
                                            item.totalCostPaise
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-slate-500">
                                        Selling price
                                    </p>

                                    <p className="font-semibold text-slate-900">
                                        {formatRupees(
                                            item.finalSellingPricePaise
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-slate-500">
                                        Profit
                                    </p>

                                    <p
                                        className={
                                            item.profitPaise >= 0
                                                ? "font-semibold text-green-700"
                                                : "font-semibold text-red-700"
                                        }
                                    >
                                        {formatRupees(
                                            item.profitPaise
                                        )}
                                    </p>
                                </div>
                            </div>

                            <p className="mt-3 text-xs text-slate-500">
                                Low-stock warning at{" "}
                                {item.lowStockTrigger}
                            </p>

                            <div className="mt-4 flex gap-2">
                                <Link
                                    to={`/admin/inventory/${item.id}/edit`}
                                    className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white"
                                >
                                    Edit
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => {
                                        void handleStatusChange(
                                            item
                                        );
                                    }}
                                    className={
                                        item.isActive
                                            ? "flex-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600"
                                            : "flex-1 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700"
                                    }
                                >
                                    {item.isActive
                                        ? "Disable"
                                        : "Enable"}
                                </button>
                            </div>
                        </article>
                    ))}
                </section>

                {!isLoading &&
                    filteredInventory.length === 0 && (
                        <div className="rounded-2xl bg-white p-8 text-center text-slate-500">
                            No matching tyres found in this section.
                        </div>
                    )}
            </div>
        </main>
    );
}
