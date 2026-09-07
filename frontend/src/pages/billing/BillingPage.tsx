import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import {
    calculateIncludedTax,
    formatInr
} from "../../utils/currency";

export default function BillingPage() {
    const { items, selectedService } = useCart();

    const [billingPrices, setBillingPrices] = useState<
        Record<string, number>
    >(() => {
        const initialPrices: Record<string, number> = {};

        items.forEach((item) => {
            initialPrices[item.tyre.productId] =
                item.tyre.finalSellingPrice;
        });

        if (selectedService) {
            initialPrices[selectedService.service.serviceId] =
                selectedService.service.sellingPrice;
        }

        return initialPrices;
    });

    function updateBillingPrice(
        lineId: string,
        newPrice: number
    ) {
        setBillingPrices((currentPrices) => ({
            ...currentPrices,
            [lineId]: Math.max(0, newPrice)
        }));
    }

    const tyreLines = items.map((item) => {
        const unitPrice =
            billingPrices[item.tyre.productId] ??
            item.tyre.finalSellingPrice;

        const lineTotal = unitPrice * item.quantity;
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
                billingPrices[selectedService.service.serviceId] ??
                selectedService.service.sellingPrice;

            const lineTotal =
                unitPrice * selectedService.quantity;

            const tax = calculateIncludedTax(
                lineTotal,
                selectedService.service.gstRatePercent
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
        (total, line) => total + line.lineTotal,
        0
    );

    const serviceTotal = serviceLine?.lineTotal ?? 0;

    const includedTaxTotal =
        tyreLines.reduce(
            (total, line) => total + line.tax.taxAmount,
            0
        ) + (serviceLine?.tax.taxAmount ?? 0);

    const grandTotal = productsTotal + serviceTotal;

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

            <div className="mx-auto max-w-3xl space-y-5 p-4">
                <section className="rounded-2xl bg-white p-4">
                    <h2 className="font-bold text-slate-900">
                        Customer & Vehicle
                    </h2>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <input
                            type="text"
                            placeholder="Customer name (optional)"
                            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-red-500"
                        />

                        <input
                            type="tel"
                            placeholder="Mobile number (optional)"
                            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-red-500"
                        />

                        <input
                            type="text"
                            placeholder="Vehicle plate number"
                            className="rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none focus:border-red-500"
                        />

                        <input
                            type="text"
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
                        ({ item, unitPrice, lineTotal, tax }) => (
                            <article
                                key={item.tyre.productId}
                                className="rounded-2xl bg-white p-4"
                            >
                                <h3 className="font-bold text-slate-900">
                                    {item.tyre.patternAndSize}
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Quantity: {item.quantity}
                                </p>

                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500">
                                            Standard unit price
                                        </label>

                                        <p className="mt-1 rounded-xl bg-slate-100 px-4 py-3 font-semibold">
                                            {formatInr(
                                                item.tyre.finalSellingPrice
                                            )}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-slate-500">
                                            Billing unit price
                                        </label>

                                        <input
                                            type="number"
                                            min="0"
                                            value={unitPrice}
                                            onChange={(event) =>
                                                updateBillingPrice(
                                                    item.tyre.productId,
                                                    Number(event.target.value)
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
                                            {item.tyre.gstRatePercent}%)
                                        </span>
                                        <span>
                                            {formatInr(tax.taxAmount)}
                                        </span>
                                    </div>

                                    <div className="mt-2 flex justify-between font-bold">
                                        <span>Line total</span>
                                        <span>
                                            {formatInr(lineTotal)}
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
                                    serviceLine.selectedService.service
                                        .name
                                }
                            </h3>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="text-xs font-semibold text-slate-500">
                                        Standard price
                                    </label>

                                    <p className="mt-1 rounded-xl bg-slate-100 px-4 py-3 font-semibold">
                                        {formatInr(
                                            serviceLine.selectedService
                                                .service.sellingPrice
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
                                        value={serviceLine.unitPrice}
                                        onChange={(event) =>
                                            updateBillingPrice(
                                                serviceLine.selectedService
                                                    .service.serviceId,
                                                Number(event.target.value)
                                            )
                                        }
                                        className="mt-1 w-full rounded-xl border border-red-300 px-4 py-3 font-bold outline-none focus:border-red-600"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 flex justify-between border-t border-slate-100 pt-3 text-sm">
                                <span className="text-slate-500">
                                    Included GST (
                                    {
                                        serviceLine.selectedService
                                            .service.gstRatePercent
                                    }
                                    %)
                                </span>

                                <span>
                                    {formatInr(
                                        serviceLine.tax.taxAmount
                                    )}
                                </span>
                            </div>
                        </article>
                    </section>
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
                            <span>{formatInr(productsTotal)}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-slate-300">
                                Services
                            </span>
                            <span>{formatInr(serviceTotal)}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-slate-300">
                                Included GST
                            </span>
                            <span>
                                {formatInr(includedTaxTotal)}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-between border-t border-slate-700 pt-4 text-xl font-bold">
                        <span>Total Payable</span>
                        <span>{formatInr(grandTotal)}</span>
                    </div>

                    <button
                        type="button"
                        disabled
                        className="mt-5 w-full cursor-not-allowed rounded-xl bg-slate-600 px-4 py-3 font-semibold text-slate-300"
                    >
                        Create Bill in Tally — Coming Later
                    </button>
                </section>
            </div>
        </main>
    );
}