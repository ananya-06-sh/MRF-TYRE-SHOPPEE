import {
    useEffect,
    useState,
    type FormEvent
} from "react";
import { useNavigate } from "react-router-dom";
import {
    changeStaffStatus,
    changeStockInPermission,
    createStaffAccount,
    getStaffAccounts,
    resetStaffPassword
} from "../../services/staffAccountApi";
import type { StaffAccount } from "../../types/staff";

export default function StaffAccountsPage() {
    const navigate = useNavigate();

    const [staff, setStaff] =
        useState<StaffAccount[]>([]);

    const [displayName, setDisplayName] =
        useState("");

    const [loginIdentifier, setLoginIdentifier] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [isLoading, setIsLoading] =
        useState(true);

    const [isSaving, setIsSaving] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [message, setMessage] =
        useState<string | null>(null);

    async function loadStaff(): Promise<void> {
        setIsLoading(true);
        setError(null);

        try {
            const accounts =
                await getStaffAccounts();

            setStaff(accounts);
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to load staff accounts."
            );
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        void loadStaff();
    }, []);

    async function handleCreate(
        event: FormEvent<HTMLFormElement>
    ): Promise<void> {
        event.preventDefault();
        setIsSaving(true);
        setError(null);
        setMessage(null);

        try {
            const newStaff =
                await createStaffAccount({
                    displayName,
                    loginIdentifier,
                    password
                });

            setStaff((currentStaff) =>
                [...currentStaff, newStaff].sort(
                    (first, second) =>
                        first.displayName.localeCompare(
                            second.displayName
                        )
                )
            );

            setDisplayName("");
            setLoginIdentifier("");
            setPassword("");
            setMessage(
                "Staff account created successfully."
            );
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to create staff account."
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handleStatusChange(
        account: StaffAccount
    ): Promise<void> {
        setError(null);
        setMessage(null);

        const newStatus =
            account.status === "ACTIVE"
                ? "DISABLED"
                : "ACTIVE";

        try {
            const updatedStaff =
                await changeStaffStatus(
                    account.id,
                    newStatus
                );

            setStaff((currentStaff) =>
                currentStaff.map((item) =>
                    item.id === updatedStaff.id
                        ? updatedStaff
                        : item
                )
            );

            setMessage(
                newStatus === "ACTIVE"
                    ? "Staff account enabled."
                    : "Staff account disabled."
            );
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to change account status."
            );
        }
    }

    async function handleStockInPermission(
        account: StaffAccount
    ): Promise<void> {
        setError(null);
        setMessage(null);

        try {
            const updatedStaff =
                await changeStockInPermission(
                    account.id,
                    !account.canStockIn
                );

            setStaff((currentStaff) =>
                currentStaff.map((item) =>
                    item.id === updatedStaff.id
                        ? updatedStaff
                        : item
                )
            );

            setMessage(
                updatedStaff.canStockIn
                    ? `${account.displayName} can now perform Stock-In.`
                    : `Stock-In permission removed from ${account.displayName}.`
            );
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to change Stock-In permission."
            );
        }
    }

    async function handlePasswordReset(
        account: StaffAccount
    ): Promise<void> {
        const newPassword = window.prompt(
            `Enter a new password for ${account.displayName}:`
        );

        if (newPassword === null) {
            return;
        }

        if (newPassword.length < 8) {
            setError(
                "The new password must contain at least 8 characters."
            );
            return;
        }

        setError(null);
        setMessage(null);

        try {
            await resetStaffPassword(
                account.id,
                newPassword
            );

            setMessage(
                `Password reset for ${account.displayName}.`
            );
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to reset password."
            );
        }
    }

    return (
        <main className="min-h-screen bg-slate-100 p-4">
            <div className="mx-auto max-w-4xl">
                <button
                    type="button"
                    onClick={() =>
                        navigate("/admin")
                    }
                    className="mb-4 text-sm font-semibold text-red-600"
                >
                    ← Admin Dashboard
                </button>

                <h1 className="text-2xl font-bold text-slate-900">
                    Staff Accounts
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    Create staff logins and control account access.
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
                        Create Staff Account
                    </h2>

                    <input
                        type="text"
                        placeholder="Staff name"
                        value={displayName}
                        onChange={(event) =>
                            setDisplayName(
                                event.target.value
                            )
                        }
                        minLength={2}
                        required
                        className="rounded-xl border border-slate-300 px-4 py-3"
                    />

                    <input
                        type="text"
                        placeholder="Login ID"
                        value={loginIdentifier}
                        onChange={(event) =>
                            setLoginIdentifier(
                                event.target.value
                            )
                        }
                        minLength={3}
                        required
                        className="rounded-xl border border-slate-300 px-4 py-3"
                    />

                    <input
                        type="password"
                        placeholder="Temporary password"
                        value={password}
                        onChange={(event) =>
                            setPassword(
                                event.target.value
                            )
                        }
                        minLength={8}
                        required
                        className="rounded-xl border border-slate-300 px-4 py-3 sm:col-span-2"
                    />

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="rounded-xl bg-red-600 px-4 py-3 font-semibold text-white disabled:bg-slate-400 sm:col-span-2"
                    >
                        {isSaving
                            ? "Creating..."
                            : "Create Staff Account"}
                    </button>
                </form>

                <section className="mt-6 space-y-3">
                    <h2 className="text-lg font-bold text-slate-900">
                        Existing Staff
                    </h2>

                    {isLoading && (
                        <p className="text-sm text-slate-500">
                            Loading staff accounts...
                        </p>
                    )}

                    {!isLoading &&
                        staff.length === 0 && (
                            <div className="rounded-2xl bg-white p-5 text-sm text-slate-500 shadow-sm">
                                No staff accounts have been created.
                            </div>
                        )}

                    {staff.map((account) => (
                        <article
                            key={account.id}
                            className="rounded-2xl bg-white p-5 shadow-sm"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-bold text-slate-900">
                                        {account.displayName}
                                    </h3>

                                    <p className="text-sm text-slate-500">
                                        Login:{" "}
                                        {account.loginIdentifier}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Stock-In:{" "}
                                        {account.canStockIn
                                            ? "Allowed"
                                            : "Not allowed"}
                                    </p>
                                </div>

                                <span
                                    className={
                                        account.status ===
                                        "ACTIVE"
                                            ? "rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700"
                                            : "rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-600"
                                    }
                                >
                                    {account.status}
                                </span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        void handleStatusChange(
                                            account
                                        );
                                    }}
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                                >
                                    {account.status ===
                                    "ACTIVE"
                                        ? "Disable Account"
                                        : "Enable Account"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        void handleStockInPermission(
                                            account
                                        );
                                    }}
                                    className={
                                        account.canStockIn
                                            ? "rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white"
                                            : "rounded-lg border border-green-600 px-3 py-2 text-sm font-semibold text-green-700"
                                    }
                                >
                                    {account.canStockIn
                                        ? "Stock-In Allowed"
                                        : "Allow Stock-In"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        void handlePasswordReset(
                                            account
                                        );
                                    }}
                                    className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                                >
                                    Reset Password
                                </button>
                            </div>
                        </article>
                    ))}
                </section>
            </div>
        </main>
    );
}