import {
    useState,
    type FormEvent
} from "react";
import { useNavigate } from "react-router-dom";
import {
    changeLoginIdentifier,
    changePassword
} from "../../services/authApi";
import { useAuth } from "../../context/AuthContext";

export default function AccountSettingsPage() {
    const navigate = useNavigate();
    const {
        user,
        refreshUser
    } = useAuth();

    const [newLoginIdentifier, setNewLoginIdentifier] =
        useState(user?.loginIdentifier ?? "");

    const [loginPassword, setLoginPassword] =
        useState("");

    const [currentPassword, setCurrentPassword] =
        useState("");

    const [newPassword, setNewPassword] =
        useState("");

    const [confirmNewPassword, setConfirmNewPassword] =
        useState("");

    const [message, setMessage] =
        useState<string | null>(null);

    const [error, setError] =
        useState<string | null>(null);

    const [isSaving, setIsSaving] =
        useState(false);

    async function handleLoginChange(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();
        setMessage(null);
        setError(null);
        setIsSaving(true);

        try {
            await changeLoginIdentifier(
                newLoginIdentifier,
                loginPassword
            );

            await refreshUser();
            setLoginPassword("");
            setMessage("Login ID changed successfully.");
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to change login ID."
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handlePasswordChange(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();
        setMessage(null);
        setError(null);

        if (newPassword !== confirmNewPassword) {
            setError("New passwords do not match.");
            return;
        }

        setIsSaving(true);

        try {
            await changePassword(
                currentPassword,
                newPassword,
                confirmNewPassword
            );

            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
            setMessage("Password changed successfully.");
        } catch (requestError: unknown) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to change password."
            );
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-100 p-4">
            <div className="mx-auto max-w-xl">
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
                    ← Back
                </button>

                <h1 className="text-2xl font-bold text-slate-900">
                    Account Settings
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    Signed in as {user?.displayName}
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
                    onSubmit={handleLoginChange}
                    className="mt-6 space-y-4 rounded-2xl bg-white p-5 shadow-sm"
                >
                    <h2 className="text-lg font-bold text-slate-900">
                        Change Login ID
                    </h2>

                    <div>
                        <label
                            htmlFor="newLoginIdentifier"
                            className="text-sm font-semibold text-slate-700"
                        >
                            New Login ID
                        </label>

                        <input
                            id="newLoginIdentifier"
                            value={newLoginIdentifier}
                            onChange={(event) =>
                                setNewLoginIdentifier(
                                    event.target.value
                                )
                            }
                            minLength={3}
                            required
                            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="loginPassword"
                            className="text-sm font-semibold text-slate-700"
                        >
                            Current Password
                        </label>

                        <input
                            id="loginPassword"
                            type="password"
                            value={loginPassword}
                            onChange={(event) =>
                                setLoginPassword(
                                    event.target.value
                                )
                            }
                            required
                            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:bg-slate-400"
                    >
                        Save Login ID
                    </button>
                </form>

                <form
                    onSubmit={handlePasswordChange}
                    className="mt-4 space-y-4 rounded-2xl bg-white p-5 shadow-sm"
                >
                    <h2 className="text-lg font-bold text-slate-900">
                        Change Password
                    </h2>

                    <input
                        type="password"
                        placeholder="Current password"
                        value={currentPassword}
                        onChange={(event) =>
                            setCurrentPassword(
                                event.target.value
                            )
                        }
                        required
                        className="w-full rounded-xl border border-slate-300 px-4 py-3"
                    />

                    <input
                        type="password"
                        placeholder="New password"
                        value={newPassword}
                        onChange={(event) =>
                            setNewPassword(
                                event.target.value
                            )
                        }
                        minLength={8}
                        required
                        className="w-full rounded-xl border border-slate-300 px-4 py-3"
                    />

                    <input
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmNewPassword}
                        onChange={(event) =>
                            setConfirmNewPassword(
                                event.target.value
                            )
                        }
                        minLength={8}
                        required
                        className="w-full rounded-xl border border-slate-300 px-4 py-3"
                    />

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white disabled:bg-slate-400"
                    >
                        Change Password
                    </button>
                </form>
            </div>
        </main>
    );
}