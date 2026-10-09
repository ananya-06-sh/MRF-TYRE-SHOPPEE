import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { getAdminInventoryItems } from "../../services/adminInventoryApi";
import { adjustStock, getStockMovements } from "../../services/stockApi";
import type { AdminInventoryItem, StockMovement } from "../../types/adminInventory";

export default function StockControlPage() {
    const [inventory, setInventory] = useState<AdminInventoryItem[]>([]);
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [selectedId, setSelectedId] = useState("");
    const [newStock, setNewStock] = useState("");
    const [reason, setReason] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    async function load(): Promise<void> {
        try {
            const [items, history] = await Promise.all([
                getAdminInventoryItems(),
                getStockMovements()
            ]);
            setInventory(items);
            setMovements(history);
        } catch (requestError: unknown) {
            setError(requestError instanceof Error ? requestError.message : "Unable to load stock data");
        }
    }

    useEffect(() => { void load(); }, []);
    const selected = inventory.find((item) => item.id === selectedId);

    async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        const quantity = Number(newStock);
        if (!selected || !Number.isInteger(quantity) || quantity < 0) {
            setError("Select a tyre and enter a valid final stock quantity.");
            return;
        }
        if (reason.trim().length < 3) {
            setError("Enter a reason for the correction.");
            return;
        }
        setIsSaving(true);
        setError(null);
        setMessage(null);
        try {
            await adjustStock({ inventoryItemId: selected.id, newStock: quantity, reason: reason.trim() });
            setMessage(`${selected.patternAndSize} stock corrected to ${quantity}.`);
            setNewStock("");
            setReason("");
            await load();
        } catch (requestError: unknown) {
            setError(requestError instanceof Error ? requestError.message : "Unable to correct stock");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-100 p-4">
            <div className="mx-auto max-w-5xl space-y-5">
                <div>
                    <Link to="/admin" className="text-sm font-semibold text-red-600">← Admin Dashboard</Link>
                    <h1 className="mt-2 text-2xl font-bold text-slate-900">Stock Control & History</h1>
                    <p className="mt-1 text-sm text-slate-500">Correct physical stock differences and audit every stock change.</p>
                </div>
                {message && <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">{message}</div>}
                {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

                <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-5 shadow-sm">
                    <h2 className="font-bold text-slate-900">Manual stock correction</h2>
                    <p className="mt-1 text-sm text-amber-700">Use this only after physically counting the tyres. Every correction is recorded.</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <select value={selectedId} onChange={(event) => { setSelectedId(event.target.value); const item = inventory.find((candidate) => candidate.id === event.target.value); setNewStock(item ? String(item.currentStock) : ""); }} required className="rounded-xl border border-slate-300 px-4 py-3">
                            <option value="">Select a tyre</option>
                            {inventory.map((item) => <option key={item.id} value={item.id}>{item.patternAndSize} — current {item.currentStock}{item.isActive ? "" : " (disabled)"}</option>)}
                        </select>
                        <input type="number" min="0" step="1" value={newStock} onChange={(event) => setNewStock(event.target.value)} placeholder="Final physical stock" required className="rounded-xl border border-slate-300 px-4 py-3" />
                    </div>
                    <textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason, e.g. Physical count found 2 extra tyres" required className="mt-3 min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3" />
                    <button type="submit" disabled={isSaving} className="mt-3 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white disabled:bg-slate-400">{isSaving ? "Saving…" : "Save Stock Correction"}</button>
                </form>

                <section className="rounded-2xl bg-white p-5 shadow-sm">
                    <h2 className="font-bold text-slate-900">Recent stock movements</h2>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="border-b border-slate-200 text-slate-500"><tr><th className="p-2">Date</th><th className="p-2">Tyre</th><th className="p-2">Type</th><th className="p-2">Change</th><th className="p-2">Before → After</th><th className="p-2">By</th><th className="p-2">Note</th></tr></thead>
                            <tbody>{movements.map((movement) => <tr key={movement.id} className="border-b border-slate-100"><td className="p-2">{new Date(movement.occurredAt).toLocaleString("en-IN")}</td><td className="p-2 font-semibold">{movement.inventoryItem.patternAndSize}</td><td className="p-2">{movement.type.replaceAll("_", " ")}</td><td className={`p-2 font-bold ${movement.quantityChange >= 0 ? "text-green-700" : "text-red-700"}`}>{movement.quantityChange > 0 ? "+" : ""}{movement.quantityChange}</td><td className="p-2">{movement.stockBefore} → {movement.stockAfter}</td><td className="p-2">{movement.performedBy.displayName}</td><td className="p-2 text-slate-500">{movement.note ?? movement.referenceNumber ?? "—"}</td></tr>)}</tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}
