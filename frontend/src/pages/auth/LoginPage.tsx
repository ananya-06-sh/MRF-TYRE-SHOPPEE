import {
    useState,
    type FormEvent
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
    const navigate = useNavigate();
    const { signIn } = useAuth();

    const [loginIdentifier, setLoginIdentifier] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    const [isLoading, setIsLoading] =
        useState(false);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();
        setErrorMessage(null);
        setIsLoading(true);

        try {
            const user = await signIn({
                loginIdentifier,
                password
            });

            navigate(
                user.role === "ADMIN"
                    ? "/admin"
                    : "/",
                {
                    replace: true
                }
            );
        } catch (error: unknown) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to log in"
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
            <section className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
                <div className="inline-flex rounded-lg bg-red-600 px-3 py-1 text-sm font-bold text-white">
                    MRF
                </div>

                <h1 className="mt-4 text-2xl font-bold text-slate-900">
                    Shop Login
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                    Sign in to access inventory and billing.
                </p>

                <form
                    onSubmit={handleSubmit}
                    className="mt-6 space-y-4"
                >
                    <div>
                        <label
                            htmlFor="loginIdentifier"
                            className="text-sm font-semibold text-slate-700"
                        >
                            Login ID
                        </label>

                        <input
                            id="loginIdentifier"
                            type="text"
                            value={loginIdentifier}
                            onChange={(event) =>
                                setLoginIdentifier(
                                    event.target.value
                                )
                            }
                            autoComplete="username"
                            required
                            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="text-sm font-semibold text-slate-700"
                        >
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            autoComplete="current-password"
                            required
                            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        />
                    </div>

                    {errorMessage && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            {errorMessage}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        {isLoading
                            ? "Signing in..."
                            : "Sign In"}
                    </button>
                </form>
            </section>
        </main>
    );
}