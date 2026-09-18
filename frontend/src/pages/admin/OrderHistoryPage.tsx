import {
    useEffect,
    useState,
    type FormEvent
} from "react";
import { Link } from "react-router-dom";
import TallyExportButton from "../../components/common/TallyExportButton";
import {
    getOrderHistory,
    getOrderHistoryById
} from "../../services/orderHistoryApi";
import type {
    OrderHistoryDetail,
    OrderHistorySummary,
    OrderStatus
} from "../../types/orderHistory";

function formatPaise(value: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(value / 100);
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(new Date(value));
}

function getStatusClasses(
    status: OrderStatus
): string {
    switch (status) {
        case "TALLY_SYNCED":
            return "bg-blue-100 text-blue-700";

        case "CANCELLED":
            return "bg-red-100 text-red-700";

        default:
            return "bg-green-100 text-green-700";
    }
}

function getStatusLabel(
    status: OrderStatus
): string {
    return status.replaceAll("_", " ");
}

export default function OrderHistoryPage() {
    const [orders, setOrders] = useState<
        OrderHistorySummary[]
    >([]);

    const [selectedOrder, setSelectedOrder] =
        useState<OrderHistoryDetail | null>(null);

    const [searchText, setSearchText] =
        useState("");

    const [isLoading, setIsLoading] =
        useState(true);

    const [
        isLoadingDetails,
        setIsLoadingDetails
    ] = useState(false);

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    async function loadOrders(search = "") {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const result =
                await getOrderHistory(search);

            setOrders(result);
        } catch (error: unknown) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to load bill history"
            );
        } finally {
            setIsLoading(false);
        }
    }

    async function openOrder(orderId: string) {
        setIsLoadingDetails(true);
        setErrorMessage(null);

        try {
            const result =
                await getOrderHistoryById(orderId);

            setSelectedOrder(result);
        } catch (error: unknown) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to load bill details"
            );
        } finally {
            setIsLoadingDetails(false);
        }
    }

    function handleSearch(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();
        setSelectedOrder(null);

        void loadOrders(searchText);
    }

    function clearSearch() {
        setSearchText("");
        setSelectedOrder(null);

        void loadOrders("");
    }

    useEffect(() => {
        void loadOrders();
    }, []);

    return (
        <main className="min-h-screen bg-slate-100">
            <header className="border-b border-slate-200 bg-white p-4">
                <div className="mx-auto max-w-6xl">
                    <Link
                        to="/admin"
                        className="text-sm font-semibold text-red-600"
                    >
                        ← Admin Dashboard
                    </Link>

                    <h1 className="mt-2 text-2xl font-bold text-slate-900">
                        Sales & Bill History
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Search and inspect confirmed customer bills.
                    </p>
                </div>
            </header>

            <div className="mx-auto max-w-6xl p-4">
                <form
                    onSubmit={handleSearch}
                    className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row"
                >
                    <input
                        type="search"
                        value={searchText}
                        onChange={(event) =>
                            setSearchText(
                                event.target.value
                            )
                        }
                        placeholder="Bill number, customer, mobile or vehicle..."
                        className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />

                    <button
                        type="submit"
                        className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
                    >
                        Search
                    </button>

                    {searchText && (
                        <button
                            type="button"
                            onClick={clearSearch}
                            className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Clear
                        </button>
                    )}
                </form>

                {errorMessage && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                        {errorMessage}
                    </div>
                )}

                <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                    <section>
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-bold text-slate-900">
                                Bills
                            </h2>

                            <span className="text-sm text-slate-500">
                                {orders.length} found
                            </span>
                        </div>

                        {isLoading ? (
                            <div className="rounded-2xl bg-white p-8 text-center text-slate-500">
                                Loading bills...
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="rounded-2xl bg-white p-8 text-center">
                                <h3 className="font-bold text-slate-900">
                                    No bills found
                                </h3>

                                <p className="mt-2 text-sm text-slate-500">
                                    Confirm a bill or try another
                                    search.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {orders.map((order) => (
                                    <button
                                        key={order.id}
                                        type="button"
                                        onClick={() => {
                                            void openOrder(
                                                order.id
                                            );
                                        }}
                                        className={`w-full rounded-2xl bg-white p-4 text-left shadow-sm transition hover:shadow-md ${
                                            selectedOrder?.id ===
                                            order.id
                                                ? "ring-2 ring-red-500"
                                                : ""
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-bold text-slate-900">
                                                    {
                                                        order.billNumber
                                                    }
                                                </p>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    {formatDate(
                                                        order.createdAt
                                                    )}
                                                </p>
                                            </div>

                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                                    order.status
                                                )}`}
                                            >
                                                {getStatusLabel(
                                                    order.status
                                                )}
                                            </span>
                                        </div>

                                        <div className="mt-3 flex items-end justify-between gap-3">
                                            <div className="text-sm text-slate-600">
                                                <p>
                                                    {order.customerName ??
                                                        "Walk-in customer"}
                                                </p>

                                                <p>
                                                    {order.vehiclePlateNumber ??
                                                        "No vehicle number"}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    Created by{" "}
                                                    {
                                                        order
                                                            .createdBy
                                                            .displayName
                                                    }
                                                </p>
                                            </div>

                                            <p className="text-lg font-bold text-red-600">
                                                {formatPaise(
                                                    order.grandTotalPaise
                                                )}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    <section>
                        <h2 className="mb-3 font-bold text-slate-900">
                            Bill Details
                        </h2>

                        {isLoadingDetails ? (
                            <div className="rounded-2xl bg-white p-8 text-center text-slate-500">
                                Loading bill details...
                            </div>
                        ) : !selectedOrder ? (
                            <div className="rounded-2xl bg-white p-8 text-center text-slate-500">
                                Select a bill to view its details.
                            </div>
                        ) : (
                            <BillDetails
                                order={selectedOrder}
                            />
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}

interface BillDetailsProps {
    order: OrderHistoryDetail;
}

function BillDetails({
                         order
                     }: BillDetailsProps) {
    return (
        <article className="space-y-5 rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                    <p className="text-xs font-semibold uppercase text-slate-400">
                        Bill number
                    </p>

                    <h3 className="text-xl font-bold text-slate-900">
                        {order.billNumber}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        {formatDate(order.createdAt)}
                    </p>
                </div>

                <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                        order.status
                    )}`}
                >
                    {getStatusLabel(order.status)}
                </span>
            </div>

            <section>
                <h4 className="font-bold text-slate-900">
                    Customer & Vehicle
                </h4>

                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <Detail
                        label="Customer"
                        value={
                            order.customerName ??
                            "Walk-in customer"
                        }
                    />

                    <Detail
                        label="Mobile"
                        value={
                            order.customerMobile ??
                            "Not provided"
                        }
                    />

                    <Detail
                        label="Vehicle number"
                        value={
                            order.vehiclePlateNumber ??
                            "Not provided"
                        }
                    />

                    <Detail
                        label="Vehicle model"
                        value={
                            order.vehicleModel ??
                            "Not provided"
                        }
                    />

                    <Detail
                        label="Created by"
                        value={
                            order.createdBy.displayName
                        }
                    />
                </div>
            </section>

            <section>
                <h4 className="font-bold text-slate-900">
                    Products
                </h4>

                <div className="mt-3 space-y-3">
                    {order.items.map((item) => (
                        <div
                            key={item.id}
                            className="rounded-xl border border-slate-200 p-3"
                        >
                            <div className="flex justify-between gap-4">
                                <div>
                                    <p className="font-semibold text-slate-900">
                                        {
                                            item.productNameSnapshot
                                        }
                                    </p>

                                    <p className="text-xs text-slate-500">
                                        {
                                            item.productIdSnapshot
                                        }
                                    </p>

                                    <p className="mt-1 text-sm text-slate-600">
                                        {item.quantity} ×{" "}
                                        {formatPaise(
                                            item.billedUnitPricePaise
                                        )}
                                    </p>
                                </div>

                                <p className="font-bold text-slate-900">
                                    {formatPaise(
                                        item.lineTotalPaise
                                    )}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {order.services.length > 0 && (
                <section>
                    <h4 className="font-bold text-slate-900">
                        Services
                    </h4>

                    <div className="mt-3 space-y-3">
                        {order.services.map(
                            (service) => (
                                <div
                                    key={service.id}
                                    className="flex justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 p-3"
                                >
                                    <div>
                                        <p className="font-semibold text-slate-900">
                                            {
                                                service.serviceNameSnapshot
                                            }
                                        </p>

                                        <p className="text-sm text-slate-600">
                                            Quantity:{" "}
                                            {
                                                service.quantity
                                            }
                                        </p>
                                    </div>

                                    <p className="font-bold text-slate-900">
                                        {formatPaise(
                                            service.lineTotalPaise
                                        )}
                                    </p>
                                </div>
                            )
                        )}
                    </div>
                </section>
            )}

            {order.serviceJob && (
                <section className="rounded-xl bg-violet-50 p-4">
                    <h4 className="font-bold text-violet-900">
                        Service Job
                    </h4>

                    <p className="mt-2 text-sm text-violet-800">
                        Job:{" "}
                        {order.serviceJob.jobNumber}
                    </p>

                    <p className="text-sm text-violet-800">
                        Technician:{" "}
                        {order.serviceJob
                                .assignedTechnician ??
                            "Not assigned"}
                    </p>

                    <p className="text-sm text-violet-800">
                        Status:{" "}
                        {order.serviceJob.status.replaceAll(
                            "_",
                            " "
                        )}
                    </p>
                </section>
            )}

            <section className="rounded-xl bg-slate-900 p-4 text-white">
                <div className="space-y-2 text-sm">
                    <SummaryRow
                        label="Products"
                        value={formatPaise(
                            order.productsTotalPaise
                        )}
                    />

                    <SummaryRow
                        label="Services"
                        value={formatPaise(
                            order.serviceTotalPaise
                        )}
                    />

                    <SummaryRow
                        label="Included GST"
                        value={formatPaise(
                            order.includedTaxPaise
                        )}
                    />
                </div>

                <div className="mt-4 flex justify-between border-t border-slate-700 pt-4 text-xl font-bold">
                    <span>Total</span>

                    <span>
                        {formatPaise(
                            order.grandTotalPaise
                        )}
                    </span>
                </div>
            </section>

            <TallyExportButton
                orderId={order.id}
                billNumber={order.billNumber}
            />
        </article>
    );
}

interface DetailProps {
    label: string;
    value: string;
}

function Detail({
                    label,
                    value
                }: DetailProps) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase text-slate-400">
                {label}
            </p>

            <p className="mt-1 font-medium text-slate-700">
                {value}
            </p>
        </div>
    );
}

interface SummaryRowProps {
    label: string;
    value: string;
}

function SummaryRow({
                        label,
                        value
                    }: SummaryRowProps) {
    return (
        <div className="flex justify-between">
            <span className="text-slate-300">
                {label}
            </span>

            <span>{value}</span>
        </div>
    );
}