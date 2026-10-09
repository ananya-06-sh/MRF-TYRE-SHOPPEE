import {
    useEffect,
    useState,
    type FormEvent
} from "react";
import { Link } from "react-router-dom";
import {
    changeServiceStatus,
    createService,
    getAdminServices,
    updateService
} from "../../services/serviceCatalogueApi";
import type {
    ServiceCatalogueInput,
    ServiceCatalogueItem,
    ServiceType
} from "../../types/serviceCatalogue";
import { formatInr } from "../../utils/currency";

const emptyForm: ServiceCatalogueInput = {
    serviceId: "",
    serviceType: "OTHER",
    name: "",
    description: "",
    sellingPriceRupees: 0,
    gstRatePercent: 18,
    createsServiceJob: true
};

export default function ServiceCataloguePage() {
    const [services, setServices] = useState<
        ServiceCatalogueItem[]
    >([]);

    const [form, setForm] =
        useState<ServiceCatalogueInput>(
            emptyForm
        );

    const [editingId, setEditingId] =
        useState<string | null>(null);

    const [isLoading, setIsLoading] =
        useState(true);

    const [isSaving, setIsSaving] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [message, setMessage] =
        useState<string | null>(null);

    async function loadServices(): Promise<void> {
        setIsLoading(true);
        setError(null);

        try {
            const result =
                await getAdminServices();

            setServices(result);
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to load services."
            );
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        void loadServices();
    }, []);

    function updateForm<K extends keyof ServiceCatalogueInput>(
        field: K,
        value: ServiceCatalogueInput[K]
    ): void {
        setForm((currentForm) => ({
            ...currentForm,
            [field]: value
        }));
    }

    function beginEditing(
        service: ServiceCatalogueItem
    ): void {
        setEditingId(service.id);

        setForm({
            serviceId: service.serviceId,
            serviceType: service.serviceType,
            name: service.name,
            description: service.description,
            sellingPriceRupees:
            service.sellingPrice,
            gstRatePercent:
            service.gstRatePercent,
            createsServiceJob:
            service.createsServiceJob
        });

        setError(null);
        setMessage(null);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    function cancelEditing(): void {
        setEditingId(null);
        setForm(emptyForm);
        setError(null);
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ): Promise<void> {
        event.preventDefault();
        setIsSaving(true);
        setError(null);
        setMessage(null);

        try {
            if (editingId) {
                const updatedService =
                    await updateService(
                        editingId,
                        form
                    );

                setServices((currentServices) =>
                    currentServices.map(
                        (service) =>
                            service.id === editingId
                                ? updatedService
                                : service
                    )
                );

                setMessage(
                    "Service updated successfully."
                );
            } else {
                const createdService =
                    await createService(form);

                setServices((currentServices) => [
                    createdService,
                    ...currentServices
                ]);

                setMessage(
                    "Service created successfully."
                );
            }

            setEditingId(null);
            setForm(emptyForm);
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to save service."
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handleStatusChange(
        service: ServiceCatalogueItem
    ): Promise<void> {
        const action = service.isActive
            ? "disable"
            : "enable";

        const confirmed = window.confirm(
            `${action === "disable" ? "Disable" : "Enable"} ${service.name}?`
        );

        if (!confirmed) {
            return;
        }

        setError(null);
        setMessage(null);

        try {
            const updatedService =
                await changeServiceStatus(
                    service.id,
                    !service.isActive
                );

            setServices((currentServices) =>
                currentServices.map(
                    (currentService) =>
                        currentService.id ===
                        service.id
                            ? updatedService
                            : currentService
                )
            );

            setMessage(
                `${service.name} was ${action}d.`
            );
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to change service status."
            );
        }
    }

    return (
        <main className="min-h-screen bg-slate-100 p-4">
            <div className="mx-auto max-w-5xl">
                <Link
                    to="/admin"
                    className="text-sm font-semibold text-red-600"
                >
                    ← Admin Dashboard
                </Link>

                <div className="mt-2">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Service Catalogue
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Add services and manage their prices,
                        GST and availability.
                    </p>
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

                <form
                    onSubmit={handleSubmit}
                    className="mt-5 rounded-2xl bg-white p-5 shadow-sm"
                >
                    <h2 className="font-bold text-slate-900">
                        {editingId
                            ? "Edit Service"
                            : "Add New Service"}
                    </h2>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="serviceId"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Service Code
                            </label>

                            <input
                                id="serviceId"
                                type="text"
                                required
                                value={form.serviceId}
                                onChange={(event) =>
                                    updateForm(
                                        "serviceId",
                                        event.target.value
                                    )
                                }
                                placeholder="SERVICE-PUNCTURE"
                                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 uppercase outline-none focus:border-red-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="serviceType"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Service Type
                            </label>

                            <select
                                id="serviceType"
                                value={form.serviceType}
                                onChange={(event) =>
                                    updateForm(
                                        "serviceType",
                                        event.target
                                            .value as ServiceType
                                    )
                                }
                                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-red-500"
                            >
                                <option value="ALIGNMENT">
                                    Wheel Alignment
                                </option>

                                <option value="BALANCING">
                                    Wheel Balancing
                                </option>

                                <option value="BOTH">
                                    Alignment + Balancing
                                </option>

                                <option value="OTHER">
                                    Other Service
                                </option>
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="serviceName"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Service Name
                            </label>

                            <input
                                id="serviceName"
                                type="text"
                                required
                                value={form.name}
                                onChange={(event) =>
                                    updateForm(
                                        "name",
                                        event.target.value
                                    )
                                }
                                placeholder="Puncture Repair"
                                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-red-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="sellingPrice"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Standard Price (₹)
                            </label>

                            <input
                                id="sellingPrice"
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={
                                    form.sellingPriceRupees
                                }
                                onChange={(event) =>
                                    updateForm(
                                        "sellingPriceRupees",
                                        Number(
                                            event.target.value
                                        )
                                    )
                                }
                                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-red-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="gstRate"
                                className="text-sm font-semibold text-slate-700"
                            >
                                GST Rate (%)
                            </label>

                            <input
                                id="gstRate"
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                required
                                value={
                                    form.gstRatePercent
                                }
                                onChange={(event) =>
                                    updateForm(
                                        "gstRatePercent",
                                        Number(
                                            event.target.value
                                        )
                                    )
                                }
                                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-red-500"
                            />
                        </div>

                        <div className="flex items-center">
                            <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3">
                                <input
                                    type="checkbox"
                                    checked={
                                        form.createsServiceJob
                                    }
                                    onChange={(event) =>
                                        updateForm(
                                            "createsServiceJob",
                                            event.target
                                                .checked
                                        )
                                    }
                                    className="h-5 w-5 accent-red-600"
                                />

                                <span className="text-sm font-semibold text-slate-700">
                                    Track this as a workshop job
                                </span>
                            </label>
                        </div>

                        <div className="sm:col-span-2">
                            <label
                                htmlFor="description"
                                className="text-sm font-semibold text-slate-700"
                            >
                                Description
                            </label>

                            <textarea
                                id="description"
                                rows={3}
                                value={form.description}
                                onChange={(event) =>
                                    updateForm(
                                        "description",
                                        event.target.value
                                    )
                                }
                                placeholder="Short description shown to Staff."
                                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-red-500"
                            />
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white disabled:bg-slate-400"
                        >
                            {isSaving
                                ? "Saving..."
                                : editingId
                                    ? "Save Changes"
                                    : "Add Service"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                onClick={cancelEditing}
                                className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>

                <section className="mt-6">
                    <h2 className="font-bold text-slate-900">
                        Existing Services
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        {isLoading
                            ? "Loading services..."
                            : `${services.length} services`}
                    </p>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        {services.map((service) => (
                            <article
                                key={service.id}
                                className={`rounded-2xl bg-white p-5 shadow-sm ${
                                    service.isActive
                                        ? ""
                                        : "opacity-60"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold text-red-600">
                                            {service.serviceId}
                                        </p>

                                        <h3 className="mt-1 font-bold text-slate-900">
                                            {service.name}
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-500">
                                            {
                                                service.description
                                            }
                                        </p>
                                    </div>

                                    <span
                                        className={
                                            service.isActive
                                                ? "rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700"
                                                : "rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600"
                                        }
                                    >
                                        {service.isActive
                                            ? "Active"
                                            : "Disabled"}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-slate-500">
                                            Price
                                        </p>

                                        <p className="font-bold text-slate-900">
                                            {formatInr(
                                                service.sellingPrice
                                            )}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-slate-500">
                                            GST
                                        </p>

                                        <p className="font-bold text-slate-900">
                                            {
                                                service.gstRatePercent
                                            }
                                            %
                                        </p>
                                    </div>
                                </div>

                                <p className="mt-3 text-xs font-semibold text-slate-500">
                                    {service.createsServiceJob
                                        ? "Creates a workshop job"
                                        : "Billing-only service"}
                                </p>

                                <div className="mt-4 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            beginEditing(
                                                service
                                            )
                                        }
                                        className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            void handleStatusChange(
                                                service
                                            );
                                        }}
                                        className="flex-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600"
                                    >
                                        {service.isActive
                                            ? "Disable"
                                            : "Enable"}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>

                    {!isLoading &&
                        services.length === 0 && (
                            <div className="mt-4 rounded-2xl bg-white p-8 text-center text-slate-500">
                                No services have been added yet.
                            </div>
                        )}
                </section>
            </div>
        </main>
    );
}