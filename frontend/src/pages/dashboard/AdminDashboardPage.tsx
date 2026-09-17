import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboardPage() {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    async function handleLogout() {
        await signOut();

        navigate("/login", {
            replace: true
        });
    }

    return (
        <main className="min-h-screen bg-slate-100">
            <header className="border-b border-slate-200 bg-white p-5">
                <div className="mx-auto flex max-w-5xl items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold uppercase text-red-600">
                            MRF Tyre Shop
                        </p>

                        <h1 className="text-3xl font-bold text-slate-900">
                            Admin Dashboard
                        </h1>

                        <p className="mt-1 text-slate-500">
                            Welcome, {user?.displayName ?? "Admin"}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
                            Admin
                        </span>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <section className="mx-auto grid max-w-5xl gap-5 p-5 sm:grid-cols-2">
                <DashboardCard
                    title="Staff Inventory View"
                    description="Search tyres as Staff members see them."
                    onClick={() => navigate("/")}
                />

                <DashboardCard
                    title="Inventory Management"
                    description="Add tyres, edit prices and manage products."
                    onClick={() =>
                        navigate("/admin/inventory")
                    }
                />

                <DashboardCard
                    title="Quick Stock-In"
                    description="Record newly received tyre stock."
                    onClick={() =>
                        navigate("/admin/stock-in")
                    }
                />

                <DashboardCard
                    title="Staff Accounts"
                    description="Create accounts and control permissions."
                    onClick={() =>
                        navigate("/admin/staff")
                    }
                />

                <DashboardCard
                    title="Sales & Bill History"
                    description="View confirmed bills and transaction details."
                    onClick={() =>
                        navigate("/admin/orders")
                    }
                />

                <DashboardCard
                    title="Service Jobs"
                    description="Track alignment and balancing work."
                    onClick={() =>
                        navigate("/services")
                    }
                />

                <DashboardCard
                    title="Account Settings"
                    description="Change your login ID or password."
                    onClick={() =>
                        navigate("/account")
                    }
                />
            </section>
        </main>
    );
}

interface DashboardCardProps {
    title: string;
    description: string;
    onClick: () => void;
}

function DashboardCard({
                           title,
                           description,
                           onClick
                       }: DashboardCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="rounded-2xl bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <h2 className="text-xl font-bold text-slate-900">
                {title}
            </h2>

            <p className="mt-2 text-slate-500">
                {description}
            </p>
        </button>
    );
}