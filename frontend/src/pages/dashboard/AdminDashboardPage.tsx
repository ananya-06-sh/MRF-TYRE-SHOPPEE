import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    downloadSalesReport,
    getAdminDashboard,
    type AdminDashboardData
} from "../../services/adminDashboardApi";

function formatPaise(value: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(value / 100);
}

function localDate(offsetDays = 0): string {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export default function AdminDashboardPage() {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [dashboard, setDashboard] =
        useState<AdminDashboardData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [fromDate, setFromDate] = useState(localDate(-29));
    const [toDate, setToDate] = useState(localDate());
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        getAdminDashboard()
            .then(setDashboard)
            .catch((requestError: unknown) => {
                setError(
                    requestError instanceof Error
                        ? requestError.message
                        : "Unable to load dashboard"
                );
            });
    }, []);

    async function handleLogout(): Promise<void> {
        await signOut();
        navigate("/login", { replace: true });
    }

    async function handleDownload(): Promise<void> {
        setError(null);
        setIsDownloading(true);
        try {
            await downloadSalesReport(fromDate, toDate);
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to download report"
            );
        } finally {
            setIsDownloading(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-100">
            <header className="border-b border-slate-200 bg-white p-5">
                <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold uppercase text-red-600">TYRE SHOPPEE</p>
                        <h1 className="text-3xl font-bold text-slate-900">Owner Dashboard</h1>
                        <p className="mt-1 text-slate-500">Welcome, {user?.displayName ?? "Admin"}</p>
                    </div>
                    <button type="button" onClick={() => void handleLogout()} className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700">Logout</button>
                </div>
            </header>

            <div className="mx-auto max-w-6xl space-y-6 p-5">
                {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

                <section>
                    <h2 className="mb-3 text-lg font-bold text-slate-900">Today at a glance</h2>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <Metric label="Sales" value={dashboard ? formatPaise(dashboard.today.salesPaise) : "…"} />
                        <Metric label="Bills" value={dashboard ? String(dashboard.today.billCount) : "…"} />
                        <Metric label="Tyres sold" value={dashboard ? String(dashboard.today.tyresSold) : "…"} />
                        <Metric label="Service revenue" value={dashboard ? formatPaise(dashboard.today.serviceSalesPaise) : "…"} />
                        <Metric label="Low stock" value={dashboard ? String(dashboard.inventory.lowStock) : "…"} tone="amber" />
                        <Metric label="Out of stock" value={dashboard ? String(dashboard.inventory.outOfStock) : "…"} tone="red" />
                        <Metric label="Pending jobs" value={dashboard ? String(dashboard.pendingServiceJobs) : "…"} tone="blue" />
                        <Metric label="Active products" value={dashboard ? String(dashboard.inventory.activeProducts) : "…"} />
                    </div>
                </section>

                <section className="rounded-2xl bg-white p-5 shadow-sm">
                    <h2 className="font-bold text-slate-900">Sales report</h2>
                    <p className="mt-1 text-sm text-slate-500">Download a date-range report that opens in Excel.</p>
                    <div className="mt-4 flex flex-wrap items-end gap-3">
                        <label className="text-sm font-semibold text-slate-600">From<input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="mt-1 block rounded-xl border border-slate-300 px-3 py-2" /></label>
                        <label className="text-sm font-semibold text-slate-600">To<input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="mt-1 block rounded-xl border border-slate-300 px-3 py-2" /></label>
                        <button type="button" disabled={isDownloading} onClick={() => void handleDownload()} className="rounded-xl bg-green-700 px-5 py-3 font-semibold text-white disabled:bg-slate-400">{isDownloading ? "Preparing…" : "Download CSV"}</button>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <DashboardCard title="Staff Inventory View" description="Search and bill tyres." onClick={() => navigate("/")} />
                    <DashboardCard title="Inventory Management" description="Add, edit, enable and disable tyres." onClick={() => navigate("/admin/inventory")} />
                    <DashboardCard title="Quick Stock-In" description="Record stock received from suppliers." onClick={() => navigate("/admin/stock-in")} />
                    <DashboardCard title="Stock Control & History" description="Correct stock and review every movement." onClick={() => navigate("/admin/stock-control")} />
                    <DashboardCard title="Staff Accounts" description="Create accounts and control permissions." onClick={() => navigate("/admin/staff")} />
                    <DashboardCard title="Sales & Bill History" description="Open, print, export or cancel bills." onClick={() => navigate("/admin/orders")} />
                    <DashboardCard title="Service Catalogue" description="Add and price workshop services." onClick={() => navigate("/admin/services")} />
                    <DashboardCard title="Service Jobs" description="Assign and complete workshop jobs." onClick={() => navigate("/services")} />
                    <DashboardCard title="Account Settings" description="Change your login ID or password." onClick={() => navigate("/account")} />
                </section>
            </div>
        </main>
    );
}

function Metric({ label, value, tone = "slate" }: { label: string; value: string; tone?: "slate" | "amber" | "red" | "blue" }) {
    const colors = {
        slate: "border-slate-200 bg-white text-slate-900",
        amber: "border-amber-200 bg-amber-50 text-amber-800",
        red: "border-red-200 bg-red-50 text-red-800",
        blue: "border-blue-200 bg-blue-50 text-blue-800"
    };
    return <div className={`rounded-2xl border p-4 shadow-sm ${colors[tone]}`}><p className="text-2xl font-bold">{value}</p><p className="mt-1 text-sm font-semibold opacity-75">{label}</p></div>;
}

function DashboardCard({ title, description, onClick }: { title: string; description: string; onClick: () => void }) {
    return <button type="button" onClick={onClick} className="rounded-2xl bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><h2 className="text-lg font-bold text-slate-900">{title}</h2><p className="mt-2 text-sm text-slate-500">{description}</p></button>;
}
