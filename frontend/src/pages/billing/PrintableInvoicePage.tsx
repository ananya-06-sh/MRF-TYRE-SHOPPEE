import {
    useEffect,
    useState
} from "react";
import {
    Link,
    useParams
} from "react-router-dom";
import { shopDetails } from "../../config/shopDetails";
import { useAuth } from "../../context/AuthContext";
import { getOrderHistoryById } from "../../services/orderHistoryApi";
import type { OrderHistoryDetail } from "../../types/orderHistory";

function formatPaise(value: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(value / 100);
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    ).format(new Date(value));
}

function formatGstRate(
    basisPoints: number
): string {
    return `${basisPoints / 100}%`;
}

export default function PrintableInvoicePage() {
    const { user } = useAuth();

    const backPath =
        user?.role === "ADMIN"
            ? "/admin/orders"
            : "/";

    const backLabel =
        user?.role === "ADMIN"
            ? "Bill History"
            : "Home";

    const { orderId } =
        useParams<{
            orderId: string;
        }>();

    const [order, setOrder] =
        useState<OrderHistoryDetail | null>(
            null
        );

    const [isLoading, setIsLoading] =
        useState(true);

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadOrder(): Promise<void> {
            if (!orderId) {
                setErrorMessage(
                    "The bill ID is missing"
                );

                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setErrorMessage(null);

            try {
                const result =
                    await getOrderHistoryById(
                        orderId
                    );

                if (isMounted) {
                    setOrder(result);
                }
            } catch (error: unknown) {
                if (isMounted) {
                    setErrorMessage(
                        error instanceof Error
                            ? error.message
                            : "Unable to load the bill"
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadOrder();

        return () => {
            isMounted = false;
        };
    }, [orderId]);

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
                <p className="text-slate-500">
                    Loading invoice...
                </p>
            </main>
        );
    }

    if (errorMessage || !order) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
                <section className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-sm">
                    <h1 className="text-xl font-bold text-red-700">
                        Unable to open invoice
                    </h1>

                    <p className="mt-2 text-sm text-slate-600">
                        {errorMessage ??
                            "Bill not found"}
                    </p>

                    <Link
                        to={backPath}
                        className="mt-5 inline-block rounded-xl bg-red-600 px-5 py-3 font-semibold text-white"
                    >
                        Back to {backLabel}
                    </Link>
                </section>
            </main>
        );
    }

    const totalLineCount =
        order.items.length +
        order.services.length;

    return (
        <main className="min-h-screen bg-slate-100 p-4 print:bg-white print:p-0">
            <div className="mx-auto mb-4 flex max-w-4xl items-center justify-between gap-3 print:hidden">
                <Link
                    to={backPath}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700"
                >
                    ← {backLabel}
                </Link>

                <button
                    type="button"
                    onClick={() =>
                        window.print()
                    }
                    className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
                >
                    Print / Save PDF
                </button>
            </div>

            <article className="mx-auto max-w-4xl bg-white p-6 shadow-sm print:max-w-none print:p-0 print:shadow-none">
                <header className="border-b-2 border-slate-900 pb-5">
                    <div className="flex flex-wrap items-start justify-between gap-5">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-wide text-red-600">
                                MRF
                            </p>

                            <h1 className="text-3xl font-bold text-slate-900">
                                {
                                    shopDetails.businessName
                                }
                            </h1>

                            {shopDetails.description && (
                                <p className="mt-1 text-sm font-semibold uppercase text-slate-700">
                                    {shopDetails.description}
                                </p>
                            )}

                            {shopDetails.ownerName && (
                                <p className="mt-2 text-sm font-semibold text-slate-700">
                                    Proprietor: {shopDetails.ownerName}
                                </p>
                            )}

                            {shopDetails.address && (
                                <p className="mt-2 max-w-md text-sm text-slate-600">
                                    {
                                        shopDetails.address
                                    }
                                </p>
                            )}

                            {shopDetails.phoneNumber && (
                                <p className="mt-1 text-sm text-slate-600">
                                    Phone:{" "}
                                    {
                                        shopDetails.phoneNumber
                                    }
                                </p>
                            )}

                            {shopDetails.email && (
                                <p className="mt-1 text-sm text-slate-600">
                                    Email: {shopDetails.email}
                                </p>
                            )}

                            {shopDetails.gstin && (
                                <p className="mt-1 text-sm font-semibold text-slate-700">
                                    GSTIN:{" "}
                                    {shopDetails.gstin}
                                </p>
                            )}

                            {shopDetails.state && (
                                <p className="mt-1 text-sm text-slate-600">
                                    State:{" "}
                                    {shopDetails.state}
                                </p>
                            )}
                        </div>

                        <div className="text-left sm:text-right">
                            <h2 className="text-2xl font-bold uppercase text-slate-900">
                                Customer Bill
                            </h2>

                            <p
                                className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                                    order.status ===
                                    "CANCELLED"
                                        ? "bg-red-100 text-red-700"
                                        : order.status ===
                                          "TALLY_SYNCED"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-green-100 text-green-700"
                                }`}
                            >
                                {order.status.replaceAll(
                                    "_",
                                    " "
                                )}
                            </p>

                            <p className="mt-3 text-sm text-slate-500">
                                Bill number
                            </p>

                            <p className="font-bold text-slate-900">
                                {order.billNumber}
                            </p>

                            <p className="mt-2 text-sm text-slate-500">
                                Date
                            </p>

                            <p className="font-semibold text-slate-900">
                                {formatDate(
                                    order.createdAt
                                )}
                            </p>
                        </div>
                    </div>
                </header>

                <section className="grid gap-4 border-b border-slate-300 py-5 sm:grid-cols-2">
                    <div>
                        <h3 className="text-sm font-bold uppercase text-slate-500">
                            Customer
                        </h3>

                        <p className="mt-2 font-semibold text-slate-900">
                            {order.customerName ??
                                "Walk-in customer"}
                        </p>

                        <p className="text-sm text-slate-600">
                            {order.customerMobile ??
                                "Mobile not provided"}
                        </p>
                    </div>

                    <div className="sm:text-right">
                        <h3 className="text-sm font-bold uppercase text-slate-500">
                            Vehicle
                        </h3>

                        <p className="mt-2 font-semibold uppercase text-slate-900">
                            {order.vehiclePlateNumber ??
                                "Not provided"}
                        </p>

                        <p className="text-sm text-slate-600">
                            {order.vehicleModel ??
                                "Vehicle model not provided"}
                        </p>
                    </div>
                </section>

                <section className="py-5">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                            <tr className="border-b-2 border-slate-900">
                                <th className="px-2 py-3">
                                    Description
                                </th>

                                <th className="px-2 py-3 text-center">
                                    Qty
                                </th>

                                <th className="px-2 py-3 text-right">
                                    Unit Price
                                </th>

                                <th className="px-2 py-3 text-center">
                                    GST
                                </th>

                                <th className="px-2 py-3 text-right">
                                    Amount
                                </th>
                            </tr>
                            </thead>

                            <tbody>
                            {order.items.map(
                                (item) => (
                                    <tr
                                        key={
                                            item.id
                                        }
                                        className="border-b border-slate-200"
                                    >
                                        <td className="px-2 py-3">
                                            <p className="font-semibold text-slate-900">
                                                {
                                                    item.productNameSnapshot
                                                }
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                Product:{" "}
                                                {
                                                    item.productIdSnapshot
                                                }
                                            </p>
                                        </td>

                                        <td className="px-2 py-3 text-center">
                                            {
                                                item.quantity
                                            }
                                        </td>

                                        <td className="px-2 py-3 text-right">
                                            {formatPaise(
                                                item.billedUnitPricePaise
                                            )}
                                        </td>

                                        <td className="px-2 py-3 text-center">
                                            {formatGstRate(
                                                item.gstRateBasisPoints
                                            )}
                                        </td>

                                        <td className="px-2 py-3 text-right font-semibold">
                                            {formatPaise(
                                                item.lineTotalPaise
                                            )}
                                        </td>
                                    </tr>
                                )
                            )}

                            {order.services.map(
                                (service) => (
                                    <tr
                                        key={
                                            service.id
                                        }
                                        className="border-b border-slate-200"
                                    >
                                        <td className="px-2 py-3">
                                            <p className="font-semibold text-slate-900">
                                                {
                                                    service.serviceNameSnapshot
                                                }
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                Service
                                            </p>
                                        </td>

                                        <td className="px-2 py-3 text-center">
                                            {
                                                service.quantity
                                            }
                                        </td>

                                        <td className="px-2 py-3 text-right">
                                            {formatPaise(
                                                service.billedUnitPricePaise
                                            )}
                                        </td>

                                        <td className="px-2 py-3 text-center">
                                            {formatGstRate(
                                                service.gstRateBasisPoints
                                            )}
                                        </td>

                                        <td className="px-2 py-3 text-right font-semibold">
                                            {formatPaise(
                                                service.lineTotalPaise
                                            )}
                                        </td>
                                    </tr>
                                )
                            )}
                            </tbody>
                        </table>
                    </div>

                    {totalLineCount === 0 && (
                        <p className="py-8 text-center text-slate-500">
                            No bill lines were found.
                        </p>
                    )}
                </section>

                <section className="ml-auto max-w-sm border-t-2 border-slate-900 pt-4">
                    <InvoiceSummaryRow
                        label="Products"
                        value={formatPaise(
                            order.productsTotalPaise
                        )}
                    />

                    <InvoiceSummaryRow
                        label="Services"
                        value={formatPaise(
                            order.serviceTotalPaise
                        )}
                    />

                    <InvoiceSummaryRow
                        label="Included GST"
                        value={formatPaise(
                            order.includedTaxPaise
                        )}
                    />

                    <div className="mt-3 flex justify-between border-t border-slate-400 pt-3 text-xl font-bold text-slate-900">
                        <span>Total</span>

                        <span>
                            {formatPaise(
                                order.grandTotalPaise
                            )}
                        </span>
                    </div>
                </section>

                <footer className="mt-12 border-t border-slate-300 pt-5 text-center">
                    <p className="font-semibold text-slate-800">
                        Thank you for your business.
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        Prices shown include applicable
                        GST.
                    </p>

                    <p className="mt-3 text-xs text-slate-400">
                        Bill created by{" "}
                        {order.createdBy.displayName}
                    </p>
                </footer>
            </article>
        </main>
    );
}

interface InvoiceSummaryRowProps {
    label: string;
    value: string;
}

function InvoiceSummaryRow({
                               label,
                               value
                           }: InvoiceSummaryRowProps) {
    return (
        <div className="mb-2 flex justify-between text-sm">
            <span className="text-slate-600">
                {label}
            </span>

            <span className="font-semibold text-slate-900">
                {value}
            </span>
        </div>
    );
}
