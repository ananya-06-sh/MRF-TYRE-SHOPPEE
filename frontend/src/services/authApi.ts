import type {
    AuthUser,
    LoginCredentials,
    LoginResponse
} from "../types/auth";

const AUTH_API_URL = "http://localhost:3000/api/v1/auth";

interface ApiErrorResponse {
    success: false;
    message?: string;
}

interface UserResponse {
    success: true;
    user: AuthUser;
}

interface MessageResponse {
    success: true;
    message: string;
}

async function parseResponse<T>(response: Response): Promise<T> {
    const data = (await response.json()) as T | ApiErrorResponse;

    if (!response.ok) {
        const error = data as ApiErrorResponse;

        throw new Error(
            error.message ?? "Something went wrong. Please try again."
        );
    }

    return data as T;
}

export async function login(
    credentials: LoginCredentials
): Promise<AuthUser> {
    const response = await fetch(`${AUTH_API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(credentials)
    });

    const data = await parseResponse<LoginResponse>(response);
    return data.user;
}

export async function getCurrentUser(): Promise<AuthUser> {
    const response = await fetch(`${AUTH_API_URL}/me`, {
        method: "GET",
        credentials: "include"
    });

    const data = await parseResponse<UserResponse>(response);
    return data.user;
}

export async function logout(): Promise<void> {
    const response = await fetch(`${AUTH_API_URL}/logout`, {
        method: "POST",
        credentials: "include"
    });

    await parseResponse<MessageResponse>(response);
}

export async function changeLoginIdentifier(
    newLoginIdentifier: string,
    currentPassword: string
): Promise<AuthUser> {
    const response = await fetch(`${AUTH_API_URL}/login-identifier`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
            newLoginIdentifier,
            currentPassword
        })
    });

    const data = await parseResponse<UserResponse>(response);
    return data.user;
}

export async function changePassword(
    currentPassword: string,
    newPassword: string,
    confirmNewPassword: string
): Promise<void> {
    const response = await fetch(`${AUTH_API_URL}/password`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmNewPassword
        })
    });

    await parseResponse<MessageResponse>(response);
}