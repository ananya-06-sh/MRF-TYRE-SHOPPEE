import {
    useState,
    type FormEvent
} from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { confirmBill } from "../../services/orderApi";
import type { ConfirmedOrder } from "../../types/billing";
import {
    calculateIncludedTax,
    formatInr
} from "../../utils/currency";

export default function BillingPage() {
    const {
        items,
        selectedService,
        clearCart
    } = useCart();

    const [customerName, setCustomerName] =
        useState("");

    const [customerMobile, setCustomerMobile] =
        useState("");

    const [
        vehiclePlateNumber,
        setVehiclePlateNumber
    ] = useState("");

    const [vehicleModel, setVehicleModel] =
        useState("");

    const [idempotencyKey] =
        useState(() => crypto.randomUUID());

    const [
        confirmedOrder,
        setConfirmedOrder
    ] = useState<ConfirmedOrder | null>(null);

    const [isConfirming, setIsConfirming] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [billingPrices, setBillingPrices] =
        useState<Record<string, number>>(() => {
            const initialPrices:
                Record<string, number> = {};

            items.forEach((item) => {
                initialPrices[item.tyre.productId] =
                    item.tyre.finalSellingPrice;
            });

            if (selectedService) {
                initialPrices[
                    selectedService.service.serviceId
                    ] =
                    selectedService.service.sellingPrice;
            }

            return initialPrices;
        });

    function updateBillingPrice(
        lineId: string,
        newPrice: number
    ): void {
        setBillingPrices((currentPrices) => ({
            ...currentPrices,
            [lineId]: Math.max(0, newPrice)
        }));
    }

    const tyreLines = items.map((item) => {
        const unitPrice =
            billingPrices[item.tyre.productId] ??
            item.tyre.finalSellingPrice;

        const lineTotal =
            unitPrice * item.quantity;

        const tax = calculateIncludedTax(
            lineTotal,
            item.tyre.gstRatePercent
        );

        return {
            item,
            unitPrice,
            lineTotal,
            tax
        };
    });

    const serviceLine = selectedService
        ? (() => {
            const unitPrice =
                billingPrices[
                    selectedService.service.serviceId
                    ] ??
                selectedService.service.sellingPrice;

            const lineTotal =
                unitPrice *
                selectedService.quantity;

            const tax = calculateIncludedTax(
                lineTotal,
                selectedService.service
                    .gstRatePercent
            );

            return {
                selectedService,
                unitPrice,
                lineTotal,
                tax
            };
        })()
        : null;

    const productsTotal = tyreLines.reduce(
        (total, line) =>
            total + line.lineTotal,
        0
    );

    const serviceTotal =
        serviceLine?.lineTotal ?? 0;

    const includedTaxTotal =
        tyreLines.reduce(
            (total, line) =>
                total + line.tax.taxAmount,
            0
        ) +
        (serviceLine?.tax.taxAmount ?? 0);

    const grandTotal =
        productsTotal + serviceTotal;

    async function handleConfirmBill(
        event: FormEvent<HTMLFormElement>
    ): Promise<void> {
        event.preventDefault();
        setError(null);
        setIsConfirming(true);

        try {
            const order = await confirmBill({
                idempotencyKey,
                customerName:
                    customerName.trim() || undefined,
                customerMobile:
                    customerMobile.trim() || undefined,
                vehiclePlateNumber:
                    vehiclePlateNumber.trim() ||
                    undefined,
                vehicleModel:
                    vehicleModel.trim() || undefined,
                products: tyreLines.map(
                    ({ item, unitPrice }) => ({
                        productId:
                        item.tyre.productId,
                        quantity: item.quantity,
                        billedUnitPriceRupees:
                        unitPrice
                    })
                ),
                service: serviceLine
                    ? {
                        serviceId:
                        serviceLine
                            .selectedService
                            .service.serviceId,
                        serviceName:
                        serviceLine
                            .selectedService
                            .service.name,
                        quantity:
                        serviceLine
                            .selectedService
                            .quantity,
                        standardUnitPriceRupees:
                        serviceLine
                            .selectedService
                            .service
                            .sellingPrice,
                        billedUnitPriceRupees:
                        serviceLine.unitPrice,
                        gstRatePercent:
                        serviceLine
                            .selectedService
                            .service
                            .gstRatePercent
                    }
                    : undefined
            });

            setConfirmedOrder(order);
            clearCart();
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to confirm bill."
            );
        } finally {
            setIsConfirming(false);
        }
    }

    if (confirmedOrder) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
                <section className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
                        ✓
                    </div>

                    <h1 className="mt-4 text-2xl font-bold text-slate-900">
                        Bill Confirmed
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Stock has been updated successfully.
                    </p>

                    <div className="mt-5 rounded-xl bg-slate-100 p-4">
                        <p className="text-xs font-semibold uppercase text-slate-500">
                            Bill Number
                        </p>

                        <p className="mt-1 font-bold text-slate-900">
                            {confirmedOrder.billNumber}
                        </p>

                        <p className="mt-4 text-xs font-semibold uppercase text-slate-500">
                            Total
                        </p>

                        <p className="mt-1 text-2xl font-bold text-red-600">
                            {formatInr(
                                confirmedOrder
                                    .grandTotalPaise /
                                100
                            )}
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled
                        className="mt-4 w-full cursor-not-allowed rounded-xl bg-slate-300 px-4 py-3 font-semibold text-slate-500"
                    >
                        Send to Tally — Coming Next
                    </button>

                    <Link
                        to="/"
                        className="mt-3 block w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white"
                    >
                        Start New Bill
                    </Link>
                </section>
            </main>
        );
    }

    if (items.length === 0) {
        return (
            <main className="min-h-screen bg-slate-100 p-4">
                <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center">
                    <h1 className="text-xl font-bold">
                        Nothing to bill
                    </h1>

                    <Link
                        to="/"
                        className="mt-5 inline-block rounded-xl bg-red-600 px-5 py-3 font-semibold text-white"
                    >
                        Find Tyres
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-100 pb-8">
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white p-4">
                <div className="mx-auto max-w-3xl">
                    <Link
                        to="/cart/services"
                        className="text-sm font-semibold text-red-600"
                    >
                        ← Back to Services
                    </Link>

                    <h1 className="mt-1 text-2xl font-bold text-slate-900">
                        Billing
                    </h1>

                    <p className="text-sm text-slate-500">
                        Prices can only be edited on this page.
                    </p>
                </div>
            </header>

            <form
                onSubmit={handleConfirmBill}
                className="mx-auto max-w-3xl space-y-5 p-4"
            >
                <section className="rounded-2xl bg-white p-4">
                    <h2 className="font-bold text-slate-900">
                        Customer & Vehicle
                    </h2>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <input
                            type="text"
                            value={customerName}
                            onChange={(event) =>
                                setCustomerName(
                                    event.target.value
                                )
                            }
                            placeholder="Customer name (optional)"
                            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-red-500"
                        />

                        <input
                            type="tel"
                            value={customerMobile}
                            onChange={(event) =>
                                setCustomerMobile(
                                    event.target.value
                                )
                            }
                            placeholder="Mobile number (optional)"
                            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-red-500"
                        />

                        <input
                            type="text"
                            value={vehiclePlateNumber}
                            onChange={(event) =>
                                setVehiclePlateNumber(
                                    event.target.value
                                )
                            }
                            placeholder="Vehicle plate number"
                            className="rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none focus:border-red-500"
                        />

                        <input
                            type="text"
                            value={vehicleModel}
                            onChange={(event) =>
                                setVehicleModel(
                                    event.target.value
                                )
                            }
                            placeholder="Vehicle model"
                            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-red-500"
                        />
                    </div>
                </section>

                <section className="space-y-3">
                    <h2 className="font-bold text-slate-900">
                        Products
                    </h2>

                    {tyreLines.map(
                        ({
                             item,
                             unitPrice,
                             lineTotal,
                             tax
                         }) => (
                            <article
                                key={
                                    item.tyre.productId
                                }
                                className="rounded-2xl bg-white p-4"
                            >
                                <h3 className="font-bold text-slate-900">
                                    {
                                        item.tyre
                                            .patternAndSize
                                    }
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Quantity:{" "}
                                    {item.quantity}
                                </p>

                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500">
                                            Standard unit
                                            price
                                        </label>

                                        <p className="mt-1 rounded-xl bg-slate-100 px-4 py-3 font-semibold">
                                            {formatInr(
                                                item.tyre
                                                    .finalSellingPrice
                                            )}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-slate-500">
                                            Billing unit
                                            price
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={
                                                unitPrice
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                updateBillingPrice(
                                                    item
                                                        .tyre
                                                        .productId,
                                                    Number(
                                                        event
                                                            .target
                                                            .value
                                                    )
                                                )
                                            }
                                            className="mt-1 w-full rounded-xl border border-red-300 px-4 py-3 font-bold outline-none focus:border-red-600"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 border-t border-slate-100 pt-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">
                                            Included GST (
                                            {
                                                item.tyre
                                                    .gstRatePercent
                                            }
                                            %)
                                        </span>

                                        <span>
                                            {formatInr(
                                                tax.taxAmount
                                            )}
                                        </span>
                                    </div>

                                    <div className="mt-2 flex justify-between font-bold">
                                        <span>
                                            Line total
                                        </span>

                                        <span>
                                            {formatInr(
                                                lineTotal
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </article>
                        )
                    )}
                </section>

                {serviceLine && (
                    <section>
                        <h2 className="mb-3 font-bold text-slate-900">
                            Service
                        </h2>

                        <article className="rounded-2xl bg-white p-4">
                            <h3 className="font-bold text-slate-900">
                                {
                                    serviceLine
                                        .selectedService
                                        .service.name
                                }
                            </h3>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500">
                                        Standard price
                                    </label>

                                    <p className="mt-1 rounded-xl bg-slate-100 px-4 py-3 font-semibold">
                                        {formatInr(
                                            serviceLine
                                                .selectedService
                                                .service
                                                .sellingPrice
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-500">
                                        Billing price
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            serviceLine.unitPrice
                                        }
                                        onChange={(event) =>
                                            updateBillingPrice(
                                                serviceLine
                                                    .selectedService
                                                    .service
                                                    .serviceId,
                                                Number(
                                                    event.target
                                                        .value
                                                )
                                            )
                                        }
                                        className="mt-1 w-full rounded-xl border border-red-300 px-4 py-3 font-bold outline-none focus:border-red-600"
                                    />
                                </div>
                            </div>
                        </article>
                    </section>
                )}

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <section className="rounded-2xl bg-slate-900 p-5 text-white">
                    <h2 className="font-bold">
                        Bill Summary
                    </h2>

                    <div className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-300">
                                Products
                            </span>

                            <span>
                                {formatInr(
                                    productsTotal
                                )}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-slate-300">
                                Services
                            </span>

                            <span>
                                {formatInr(
                                    serviceTotal
                                )}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-slate-300">
                                Included GST
                            </span>

                            <span>
                                {formatInr(
                                    includedTaxTotal
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-between border-t border-slate-700 pt-4 text-xl font-bold">
                        <span>Total Payable</span>

                        <span>
                            {formatInr(grandTotal)}
                        </span>
                    </div>

                    <button
                        type="submit"
                        disabled={isConfirming}
                        className="mt-5 w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white disabled:bg-slate-600"
                    >
                        {isConfirming
                            ? "Confirming Bill..."
                            : "Confirm Bill & Update Stock"}
                    </button>
                </section>
            </form>
        </main>
    );
}