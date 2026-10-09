import {
    useEffect,
    useState
} from "react";
import { useCart } from "../../context/CartContext";
import { getActiveServices } from "../../services/serviceCatalogueApi";
import type { ShopService } from "../../types/order";
import { formatInr } from "../../utils/currency";

export default function ServiceSelector() {
    const {
        selectedServices,
        toggleService,
        updateServiceQuantity,
        clearServices
    } = useCart();

    const [services, setServices] =
        useState<ShopService[]>([]);

    const [isLoading, setIsLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadServices(): Promise<void> {
            setIsLoading(true);
            setError(null);

            try {
                const result =
                    await getActiveServices();

                if (isMounted) {
                    setServices(result);
                }
            } catch (requestError: unknown) {
                if (isMounted) {
                    setError(
                        requestError instanceof Error
                            ? requestError.message
                            : "Unable to load services."
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadServices();

        return () => {
            isMounted = false;
        };
    }, []);

    if (isLoading) {
        return (
            <div className="rounded-2xl bg-white p-6 text-center text-slate-500">
                Loading services...
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                {error}
            </div>
        );
    }

    return (
        <section>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">
                        Add Services
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Select one or more services for this
                        vehicle.
                    </p>
                </div>

                {selectedServices.length > 0 && (
                    <button
                        type="button"
                        onClick={clearServices}
                        className="shrink-0 text-sm font-semibold text-red-600"
                    >
                        Clear All
                    </button>
                )}
            </div>

            <div className="mt-4 space-y-3">
                {services.map((service) => {
                    const selected =
                        selectedServices.find(
                            (item) =>
                                item.service
                                    .serviceId ===
                                service.serviceId
                        );

                    const isSelected =
                        selected !== undefined;

                    return (
                        <article
                            key={service.serviceId}
                            className={`rounded-2xl border p-4 transition ${
                                isSelected
                                    ? "border-red-600 bg-red-50 ring-2 ring-red-100"
                                    : "border-slate-200 bg-white"
                            }`}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    toggleService(service)
                                }
                                className="w-full text-left"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="font-bold text-slate-900">
                                            {service.name}
                                        </h3>

                                        {service.description && (
                                            <p className="mt-1 text-sm text-slate-500">
                                                {
                                                    service.description
                                                }
                                            </p>
                                        )}

                                        <p className="mt-2 text-xs font-semibold text-slate-500">
                                            GST{" "}
                                            {
                                                service.gstRatePercent
                                            }
                                            %
                                        </p>
                                    </div>

                                    <p className="shrink-0 font-bold text-slate-900">
                                        {formatInr(
                                            service.sellingPrice
                                        )}
                                    </p>
                                </div>

                                <p
                                    className={`mt-3 text-sm font-semibold ${
                                        isSelected
                                            ? "text-red-600"
                                            : "text-slate-500"
                                    }`}
                                >
                                    {isSelected
                                        ? "✓ Selected"
                                        : "+ Add Service"}
                                </p>
                            </button>

                            {selected && (
                                <div className="mt-4 flex items-center justify-between border-t border-red-200 pt-3">
                                    <label
                                        htmlFor={`service-quantity-${service.serviceId}`}
                                        className="text-sm font-semibold text-slate-700"
                                    >
                                        Quantity
                                    </label>

                                    <input
                                        id={`service-quantity-${service.serviceId}`}
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={
                                            selected.quantity
                                        }
                                        onChange={(event) =>
                                            updateServiceQuantity(
                                                service.serviceId,
                                                Number(
                                                    event.target
                                                        .value
                                                )
                                            )
                                        }
                                        className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-center font-semibold outline-none focus:border-red-500"
                                    />
                                </div>
                            )}
                        </article>
                    );
                })}

                {services.length === 0 && (
                    <div className="rounded-2xl bg-white p-6 text-center text-slate-500">
                        No active services are available.
                        Ask the Admin to add services through
                        the Service Catalogue.
                    </div>
                )}

                <button
                    type="button"
                    onClick={clearServices}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                        selectedServices.length === 0
                            ? "border-red-600 bg-red-50 ring-2 ring-red-100"
                            : "border-slate-200 bg-white hover:border-red-300"
                    }`}
                >
                    <h3 className="font-bold text-slate-900">
                        No Additional Service
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        Continue without adding a service.
                    </p>
                </button>
            </div>
        </section>
    );
}