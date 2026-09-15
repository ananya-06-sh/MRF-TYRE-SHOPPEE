import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode
} from "react";
import {
    getCurrentUser,
    login,
    logout
} from "../services/authApi";
import type {
    AuthUser,
    LoginCredentials
} from "../types/auth";

interface AuthContextValue {
    user: AuthUser | null;
    isLoading: boolean;
    signIn(credentials: LoginCredentials): Promise<AuthUser>;
    signOut(): Promise<void>;
    refreshUser(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    async function refreshUser(): Promise<void> {
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        void refreshUser();
    }, []);

    async function signIn(
        credentials: LoginCredentials
    ): Promise<AuthUser> {
        const authenticatedUser = await login(credentials);
        setUser(authenticatedUser);
        return authenticatedUser;
    }

    async function signOut(): Promise<void> {
        await logout();
        setUser(null);
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                signIn,
                signOut,
                refreshUser
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}