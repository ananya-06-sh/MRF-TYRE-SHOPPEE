import { useCart } from "../../context/CartContext";
import { mockServices } from "../../data/mockServices";
import { formatInr } from "../../utils/currency";

export default function ServiceSelector() {
    const { selectedService, selectService } = useCart();

    return (
        <section>
            <h2 className="text-lg font-bold text-slate-900">
                Add a Service
            </h2>

            <p className="mt-1 text-sm text-slate-500">
                Select one option for this vehicle.
            </p>

            <div className="mt-4 space-y-3">
                {mockServices.map((service) => {
                    const isSelected =
                        selectedService?.service.serviceId ===
                        service.serviceId;

                    return (
                        <button
                            key={service.serviceId}
                            type="button"
                            onClick={() => selectService(service)}
                            className={`w-full rounded-2xl border p-4 text-left transition ${
                                isSelected
                                    ? "border-red-600 bg-red-50 ring-2 ring-red-100"
                                    : "border-slate-200 bg-white hover:border-red-300"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="font-bold text-slate-900">
                                        {service.name}
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        {service.description}
                                    </p>
                                </div>

                                <p className="shrink-0 font-bold text-slate-900">
                                    {formatInr(service.sellingPrice)}
                                </p>
                            </div>

                            {isSelected && (
                                <p className="mt-3 text-sm font-semibold text-red-600">
                                    ✓ Selected
                                </p>
                            )}
                        </button>
                    );
                })}

                <button
                    type="button"
                    onClick={() => selectService(null)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                        selectedService === null
                            ? "border-red-600 bg-red-50 ring-2 ring-red-100"
                            : "border-slate-200 bg-white hover:border-red-300"
                    }`}
                >
                    <h3 className="font-bold text-slate-900">
                        No Additional Service
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        Continue with tyres only.
                    </p>
                </button>
            </div>
        </section>
    );
}