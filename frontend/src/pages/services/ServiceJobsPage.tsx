import {
    useEffect,
    useMemo,
    useState,
    type FormEvent
} from "react";
import { useNavigate } from "react-router-dom";
import {
    assignServiceTechnician,
    changeServiceJobStatus,
    createServiceJob,
    getServiceJobs
} from "../../services/serviceJobApi";
import type {
    ServiceJob,
    ServiceJobType
} from "../../types/serviceJob";
import { useAuth } from "../../context/AuthContext";

function formatServiceType(
    serviceType: ServiceJobType
): string {
    if (serviceType === "ALIGNMENT") {
        return "Wheel Alignment";
    }

    if (serviceType === "BALANCING") {
        return "Wheel Balancing";
    }

    return "Alignment & Balancing";
}

export default function ServiceJobsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [jobs, setJobs] =
        useState<ServiceJob[]>([]);

    const [search, setSearch] =
        useState("");

    const [
        vehiclePlateNumber,
        setVehiclePlateNumber
    ] = useState("");

    const [vehicleModel, setVehicleModel] =
        useState("");

    const [serviceType, setServiceType] =
        useState<ServiceJobType>("ALIGNMENT");

    const [
        assignedTechnician,
        setAssignedTechnician
    ] = useState("");

    const [isLoading, setIsLoading] =
        useState(true);

    const [isSaving, setIsSaving] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [message, setMessage] =
        useState<string | null>(null);

    const filteredJobs = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) {
            return jobs;
        }

        return jobs.filter((job) =>
            [
                job.jobNumber,
                job.vehiclePlateNumber,
                job.vehicleModel,
                job.assignedTechnician ?? "",
                job.order?.billNumber ?? ""
            ].some((value) =>
                value.toLowerCase().includes(query)
            )
        );
    }, [jobs, search]);

    async function loadJobs(): Promise<void> {
        setIsLoading(true);
        setError(null);

        try {
            const serviceJobs =
                await getServiceJobs();

            setJobs(serviceJobs);
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to load service jobs."
            );
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        void loadJobs();
    }, []);

    async function handleCreate(
        event: FormEvent<HTMLFormElement>
    ): Promise<void> {
        event.preventDefault();
        setIsSaving(true);
        setError(null);
        setMessage(null);

        try {
            await createServiceJob({
                vehiclePlateNumber,
                vehicleModel,
                serviceType,
                assignedTechnician:
                    assignedTechnician.trim() ||
                    undefined
            });

            setVehiclePlateNumber("");
            setVehicleModel("");
            setAssignedTechnician("");
            setServiceType("ALIGNMENT");

            await loadJobs();

            setMessage(
                "Service job created successfully."
            );
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to create service job."
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handleTechnician(
        job: ServiceJob
    ): Promise<void> {
        const technicianName = window.prompt(
            `Technician for ${job.jobNumber}:`,
            job.assignedTechnician ?? ""
        );

        if (technicianName === null) {
            return;
        }

        setError(null);
        setMessage(null);

        try {
            await assignServiceTechnician(
                job.id,
                technicianName.trim() || null
            );

            await loadJobs();

            setMessage(
                "Technician updated successfully."
            );
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to assign technician."
            );
        }
    }

    async function handleStatus(
        job: ServiceJob
    ): Promise<void> {
        const newStatus =
            job.status === "IN_PROGRESS"
                ? "COMPLETED"
                : "IN_PROGRESS";

        setError(null);
        setMessage(null);

        try {
            await changeServiceJobStatus(
                job.id,
                newStatus
            );

            await loadJobs();

            setMessage(
                newStatus === "COMPLETED"
                    ? "Service marked as completed."
                    : "Service moved back to in progress."
            );
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to update service status."
            );
        }
    }

    return (
        <main className="min-h-screen bg-slate-100 p-4">
            <div className="mx-auto max-w-5xl">
                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            user?.role === "ADMIN"
                                ? "/admin"
                                : "/"
                        )
                    }
                    className="mb-4 text-sm font-semibold text-red-600"
                >
                    ← Dashboard
                </button>

                <h1 className="text-2xl font-bold text-slate-900">
                    Service Jobs
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    Track alignment and balancing work.
                </p>

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
                    onSubmit={handleCreate}
                    className="mt-6 grid gap-4 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-2"
                >
                    <h2 className="text-lg font-bold text-slate-900 sm:col-span-2">
                        New Service Job
                    </h2>

                    <input
                        value={vehiclePlateNumber}
                        onChange={(event) =>
                            setVehiclePlateNumber(
                                event.target.value
                            )
                        }
                        placeholder="Vehicle plate number"
                        required
                        className="rounded-xl border border-slate-300 px-4 py-3 uppercase"
                    />

                    <input
                        value={vehicleModel}
                        onChange={(event) =>
                            setVehicleModel(
                                event.target.value
                            )
                        }
                        placeholder="Vehicle model"
                        required
                        className="rounded-xl border border-slate-300 px-4 py-3"
                    />

                    <select
                        value={serviceType}
                        onChange={(event) =>
                            setServiceType(
                                event.target
                                    .value as ServiceJobType
                            )
                        }
                        className="rounded-xl border border-slate-300 px-4 py-3"
                    >
                        <option value="ALIGNMENT">
                            Wheel Alignment
                        </option>

                        <option value="BALANCING">
                            Wheel Balancing
                        </option>

                        <option value="BOTH">
                            Alignment & Balancing
                        </option>
                    </select>

                    <input
                        value={assignedTechnician}
                        onChange={(event) =>
                            setAssignedTechnician(
                                event.target.value
                            )
                        }
                        placeholder="Technician (optional)"
                        className="rounded-xl border border-slate-300 px-4 py-3"
                    />

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="rounded-xl bg-red-600 px-4 py-3 font-semibold text-white disabled:bg-slate-400 sm:col-span-2"
                    >
                        {isSaving
                            ? "Creating..."
                            : "Create Service Job"}
                    </button>
                </form>

                <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                        setSearch(event.target.value)
                    }
                    placeholder="Search plate, model, job or technician"
                    className="mt-6 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
                />

                <div className="mt-4 space-y-3">
                    {isLoading && (
                        <p className="text-sm text-slate-500">
                            Loading service jobs...
                        </p>
                    )}

                    {!isLoading &&
                        filteredJobs.length === 0 && (
                            <div className="rounded-2xl bg-white p-6 text-center text-slate-500">
                                No service jobs found.
                            </div>
                        )}

                    {filteredJobs.map((job) => (
                        <article
                            key={job.id}
                            className="rounded-2xl bg-white p-5 shadow-sm"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-bold text-red-600">
                                        {job.jobNumber}
                                    </p>

                                    <h2 className="text-lg font-bold text-slate-900">
                                        {
                                            job.vehiclePlateNumber
                                        }
                                    </h2>

                                    <p className="text-sm text-slate-500">
                                        {job.vehicleModel} ·{" "}
                                        {formatServiceType(
                                            job.serviceType
                                        )}
                                    </p>
                                </div>

                                <span
                                    className={
                                        job.status ===
                                        "COMPLETED"
                                            ? "rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700"
                                            : "rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700"
                                    }
                                >
                                    {job.status ===
                                    "COMPLETED"
                                        ? "Completed"
                                        : "In Progress"}
                                </span>
                            </div>

                            <div className="mt-3 text-sm text-slate-600">
                                <p>
                                    Technician:{" "}
                                    <strong>
                                        {job.assignedTechnician ??
                                            "Not assigned"}
                                    </strong>
                                </p>

                                {job.order && (
                                    <p>
                                        Bill:{" "}
                                        {job.order.billNumber}
                                    </p>
                                )}

                                <p>
                                    Created by:{" "}
                                    {
                                        job.createdBy
                                            .displayName
                                    }
                                </p>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        void handleTechnician(
                                            job
                                        );
                                    }}
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                                >
                                    Assign Technician
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        void handleStatus(
                                            job
                                        );
                                    }}
                                    className={
                                        job.status ===
                                        "COMPLETED"
                                            ? "rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white"
                                            : "rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white"
                                    }
                                >
                                    {job.status ===
                                    "COMPLETED"
                                        ? "Reopen"
                                        : "Mark Completed"}
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </main>
    );
}