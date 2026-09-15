import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboardPage() {
    const navigate = useNavigate();

    const {
        user,
        signOut
    } = useAuth();

    async function handleLogout(): Promise<void> {
        await signOut();

        navigate("/login", {
            replace: true
        });
    }

    return (
        <main className="min-h-screen bg-slate-100">
            <header className="border-b border-slate-200 bg-white p-4">
                <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold text-red-600">
                            MRF TYRE SHOP
                        </p>

                        <h1 className="text-2xl font-bold text-slate-900">
                            Admin Dashboard
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Welcome, {user?.displayName}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                            Admin
                        </span>

                        <button
                            type="button"
                            onClick={() => {
                                void handleLogout();
                            }}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <section className="mx-auto grid max-w-5xl gap-4 p-4 sm:grid-cols-2">
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="rounded-2xl bg-white p-5 text-left shadow-sm hover:shadow-md"
                >
                    <h2 className="text-lg font-bold text-slate-900">
                        View Inventory
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Search tyres and check available stock.
                    </p>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        navigate("/admin/stock-in")
                    }
                    className="rounded-2xl bg-white p-5 text-left shadow-sm hover:shadow-md"
                >
                    <h2 className="text-lg font-bold text-slate-900">
                        Quick Stock-In
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Record newly received tyre stock.
                    </p>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        navigate("/admin/staff")
                    }
                    className="rounded-2xl bg-white p-5 text-left shadow-sm hover:shadow-md"
                >
                    <h2 className="text-lg font-bold text-slate-900">
                        Staff Accounts
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Create and manage staff logins.
                    </p>
                </button>

                <button
                    type="button"
                    onClick={() =>
                        navigate("/account")
                    }
                    className="rounded-2xl bg-white p-5 text-left shadow-sm hover:shadow-md"
                >
                    <h2 className="text-lg font-bold text-slate-900">
                        Account Settings
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Change your login ID or password.
                    </p>
                </button>
            </section>
        </main>
    );
}