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
        selectedServices,
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
    ] = useState<ConfirmedOrder | null>(
        null
    );

    const [isConfirming, setIsConfirming] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [billingPrices, setBillingPrices] =
        useState<Record<string, number>>(
            () => {
                const initialPrices:
                    Record<string, number> =
                    {};

                items.forEach((item) => {
                    initialPrices[
                        item.tyre.productId
                        ] =
                        item.tyre
                            .finalSellingPrice;
                });

                selectedServices.forEach(
                    (selectedService) => {
                        initialPrices[
                            selectedService
                                .service
                                .serviceId
                            ] =
                            selectedService
                                .service
                                .sellingPrice;
                    }
                );

                return initialPrices;
            }
        );

    function updateBillingPrice(
        lineId: string,
        newPrice: number
    ): void {
        setBillingPrices(
            (currentPrices) => ({
                ...currentPrices,

                [lineId]: Math.max(
                    0,
                    Number.isFinite(newPrice)
                        ? newPrice
                        : 0
                )
            })
        );
    }

    const tyreLines = items.map(
        (item) => {
            const unitPrice =
                billingPrices[
                    item.tyre.productId
                    ] ??
                item.tyre.finalSellingPrice;

            const lineTotal =
                unitPrice *
                item.quantity;

            const tax =
                calculateIncludedTax(
                    lineTotal,
                    item.tyre
                        .gstRatePercent
                );

            return {
                item,
                unitPrice,
                lineTotal,
                tax
            };
        }
    );

    const serviceLines =
        selectedServices.map(
            (selectedService) => {
                const service =
                    selectedService.service;

                const unitPrice =
                    billingPrices[
                        service.serviceId
                        ] ??
                    service.sellingPrice;

                const lineTotal =
                    unitPrice *
                    selectedService.quantity;

                const tax =
                    calculateIncludedTax(
                        lineTotal,
                        service.gstRatePercent
                    );

                return {
                    selectedService,
                    unitPrice,
                    lineTotal,
                    tax
                };
            }
        );

    const productsTotal =
        tyreLines.reduce(
            (total, line) =>
                total +
                line.lineTotal,
            0
        );

    const serviceTotal =
        serviceLines.reduce(
            (total, line) =>
                total +
                line.lineTotal,
            0
        );

    const includedTaxTotal =
        tyreLines.reduce(
            (total, line) =>
                total +
                line.tax.taxAmount,
            0
        ) +
        serviceLines.reduce(
            (total, line) =>
                total +
                line.tax.taxAmount,
            0
        );

    const grandTotal =
        productsTotal +
        serviceTotal;

    const hasProducts =
        items.length > 0;

    const hasServices =
        selectedServices.length > 0;

    const requiresVehicleDetails =
        selectedServices.some(
            (selectedService) =>
                selectedService.service
                    .createsServiceJob !==
                false
        );

    async function handleConfirmBill(
        event: FormEvent<HTMLFormElement>
    ): Promise<void> {
        event.preventDefault();

        if (
            !hasProducts &&
            !hasServices
        ) {
            setError(
                "Add at least one tyre or service."
            );

            return;
        }

        setError(null);
        setIsConfirming(true);

        try {
            const order =
                await confirmBill({
                    idempotencyKey,

                    customerName:
                        customerName.trim() ||
                        undefined,

                    customerMobile:
                        customerMobile.trim() ||
                        undefined,

                    vehiclePlateNumber:
                        vehiclePlateNumber
                            .trim() ||
                        undefined,

                    vehicleModel:
                        vehicleModel.trim() ||
                        undefined,

                    products:
                        tyreLines.map(
                            ({
                                 item,
                                 unitPrice
                             }) => ({
                                productId:
                                item.tyre
                                    .productId,

                                quantity:
                                item.quantity,

                                billedUnitPriceRupees:
                                unitPrice
                            })
                        ),

                    services:
                        serviceLines.map(
                            ({
                                 selectedService,
                                 unitPrice
                             }) => ({
                                serviceId:
                                selectedService
                                    .service
                                    .serviceId,

                                serviceType:
                                selectedService
                                    .service
                                    .serviceType,

                                serviceName:
                                selectedService
                                    .service
                                    .name,

                                quantity:
                                selectedService
                                    .quantity,

                                standardUnitPriceRupees:
                                selectedService
                                    .service
                                    .sellingPrice,

                                billedUnitPriceRupees:
                                unitPrice,

                                gstRatePercent:
                                selectedService
                                    .service
                                    .gstRatePercent
                            })
                        )
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
                        The bill was saved and tyre
                        stock was updated.
                    </p>

                    <div className="mt-5 rounded-xl bg-slate-100 p-4">
                        <p className="text-xs font-semibold uppercase text-slate-500">
                            Bill Number
                        </p>

                        <p className="mt-1 font-bold text-slate-900">
                            {
                                confirmedOrder
                                    .billNumber
                            }
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

                    <Link
                        to={`/admin/orders/${confirmedOrder.id}/print`}
                        className="mt-4 block w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800"
                    >
                        Print Customer Bill
                    </Link>

                    <Link
                        to="/"
                        className="mt-3 block w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
                    >
                        Start New Bill
                    </Link>
                </section>
            </main>
        );
    }

    if (
        !hasProducts &&
        !hasServices
    ) {
        return (
            <main className="min-h-screen bg-slate-100 p-4">
                <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 text-center">
                    <h1 className="text-xl font-bold text-slate-900">
                        Nothing to bill
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Add tyres or select a service
                        before continuing.
                    </p>

                    <div className="mt-5 flex flex-wrap justify-center gap-3">
                        <Link
                            to="/"
                            className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"
                        >
                            Find Tyres
                        </Link>

                        <Link
                            to="/cart/services"
                            className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white"
                        >
                            Select Services
                        </Link>
                    </div>
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
                        Review products and services
                        before confirming the bill.
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
                                    event.target
                                        .value
                                )
                            }
                            placeholder="Customer name (optional)"
                            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-red-500"
                        />

                        <input
                            type="tel"
                            value={
                                customerMobile
                            }
                            onChange={(event) =>
                                setCustomerMobile(
                                    event.target
                                        .value
                                )
                            }
                            placeholder="Mobile number (optional)"
                            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-red-500"
                        />

                        <input
                            type="text"
                            value={
                                vehiclePlateNumber
                            }
                            onChange={(event) =>
                                setVehiclePlateNumber(
                                    event.target
                                        .value
                                )
                            }
                            placeholder={
                                requiresVehicleDetails
                                    ? "Vehicle plate number (required)"
                                    : "Vehicle plate number (optional)"
                            }
                            required={
                                requiresVehicleDetails
                            }
                            className="rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none focus:border-red-500"
                        />

                        <input
                            type="text"
                            value={vehicleModel}
                            onChange={(event) =>
                                setVehicleModel(
                                    event.target
                                        .value
                                )
                            }
                            placeholder={
                                requiresVehicleDetails
                                    ? "Vehicle model (required)"
                                    : "Vehicle model (optional)"
                            }
                            required={
                                requiresVehicleDetails
                            }
                            className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-red-500"
                        />
                    </div>
                </section>

                {hasProducts && (
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
                                        item.tyre
                                            .productId
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
                                        {
                                            item.quantity
                                        }
                                    </p>

                                    <PriceFields
                                        standardPrice={
                                            item.tyre
                                                .finalSellingPrice
                                        }
                                        billingPrice={
                                            unitPrice
                                        }
                                        onChange={(
                                            value
                                        ) =>
                                            updateBillingPrice(
                                                item.tyre
                                                    .productId,
                                                value
                                            )
                                        }
                                    />

                                    <LineSummary
                                        gstRate={
                                            item.tyre
                                                .gstRatePercent
                                        }
                                        taxAmount={
                                            tax.taxAmount
                                        }
                                        lineTotal={
                                            lineTotal
                                        }
                                    />
                                </article>
                            )
                        )}
                    </section>
                )}

                {hasServices && (
                    <section className="space-y-3">
                        <h2 className="font-bold text-slate-900">
                            Services
                        </h2>

                        {serviceLines.map(
                            ({
                                 selectedService,
                                 unitPrice,
                                 lineTotal,
                                 tax
                             }) => (
                                <article
                                    key={
                                        selectedService
                                            .service
                                            .serviceId
                                    }
                                    className="rounded-2xl bg-white p-4"
                                >
                                    <h3 className="font-bold text-slate-900">
                                        {
                                            selectedService
                                                .service
                                                .name
                                        }
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Quantity:{" "}
                                        {
                                            selectedService
                                                .quantity
                                        }
                                    </p>

                                    <PriceFields
                                        standardPrice={
                                            selectedService
                                                .service
                                                .sellingPrice
                                        }
                                        billingPrice={
                                            unitPrice
                                        }
                                        onChange={(
                                            value
                                        ) =>
                                            updateBillingPrice(
                                                selectedService
                                                    .service
                                                    .serviceId,
                                                value
                                            )
                                        }
                                    />

                                    <LineSummary
                                        gstRate={
                                            selectedService
                                                .service
                                                .gstRatePercent
                                        }
                                        taxAmount={
                                            tax.taxAmount
                                        }
                                        lineTotal={
                                            lineTotal
                                        }
                                    />
                                </article>
                            )
                        )}
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
                        <SummaryRow
                            label="Products"
                            amount={
                                productsTotal
                            }
                        />

                        <SummaryRow
                            label="Services"
                            amount={
                                serviceTotal
                            }
                        />

                        <SummaryRow
                            label="Included GST"
                            amount={
                                includedTaxTotal
                            }
                        />
                    </div>

                    <div className="mt-4 flex justify-between border-t border-slate-700 pt-4 text-xl font-bold">
                        <span>
                            Total Payable
                        </span>

                        <span>
                            {formatInr(
                                grandTotal
                            )}
                        </span>
                    </div>

                    <button
                        type="submit"
                        disabled={isConfirming}
                        className="mt-5 w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white disabled:bg-slate-600"
                    >
                        {isConfirming
                            ? "Confirming Bill..."
                            : hasProducts
                                ? "Confirm Bill & Update Stock"
                                : "Confirm Service Bill"}
                    </button>
                </section>
            </form>
        </main>
    );
}

interface PriceFieldsProps {
    standardPrice: number;
    billingPrice: number;
    onChange: (
        value: number
    ) => void;
}

function PriceFields({
                         standardPrice,
                         billingPrice,
                         onChange
                     }: PriceFieldsProps) {
    return (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
                <label className="text-xs font-semibold text-slate-500">
                    Standard unit price
                </label>

                <p className="mt-1 rounded-xl bg-slate-100 px-4 py-3 font-semibold">
                    {formatInr(
                        standardPrice
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
                    step="0.01"
                    value={billingPrice}
                    onChange={(event) =>
                        onChange(
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
    );
}

interface LineSummaryProps {
    gstRate: number;
    taxAmount: number;
    lineTotal: number;
}

function LineSummary({
                         gstRate,
                         taxAmount,
                         lineTotal
                     }: LineSummaryProps) {
    return (
        <div className="mt-4 border-t border-slate-100 pt-3 text-sm">
            <div className="flex justify-between">
                <span className="text-slate-500">
                    Included GST (
                    {gstRate}%)
                </span>

                <span>
                    {formatInr(
                        taxAmount
                    )}
                </span>
            </div>

            <div className="mt-2 flex justify-between font-bold">
                <span>Line total</span>

                <span>
                    {formatInr(
                        lineTotal
                    )}
                </span>
            </div>
        </div>
    );
}

interface SummaryRowProps {
    label: string;
    amount: number;
}

function SummaryRow({
                        label,
                        amount
                    }: SummaryRowProps) {
    return (
        <div className="flex justify-between">
            <span className="text-slate-300">
                {label}
            </span>

            <span>
                {formatInr(amount)}
            </span>
        </div>
    );
}