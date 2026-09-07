export default function App() {
    return (
        <main className="min-h-screen bg-slate-100 p-6">
            <section className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-lg">
                <div className="mb-4 inline-flex rounded-lg bg-red-600 px-3 py-1 text-sm font-bold text-white">
                    MRF
                </div>

                <h1 className="text-3xl font-bold text-slate-900">
                    MRF Tyre Shop
                </h1>

                <p className="mt-2 text-slate-600">
                    Inventory and service management application
                </p>

                <button
                    type="button"
                    className="mt-6 w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
                >
                    Get Started
                </button>
            </section>
        </main>
    );
}