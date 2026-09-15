import type {
    CreateStaffInput,
    StaffAccount,
    StaffStatus
} from "../types/staff";

const STAFF_API_URL =
    "http://localhost:3000/api/v1/admin/staff";

interface ApiErrorResponse {
    success: false;
    message?: string;
}

interface StaffListResponse {
    success: true;
    staff: StaffAccount[];
}

interface StaffResponse {
    success: true;
    staff: StaffAccount;
}

interface MessageResponse {
    success: true;
    message: string;
}

async function parseResponse<T>(
    response: Response
): Promise<T> {
    const data = (await response.json()) as
        | T
        | ApiErrorResponse;

    if (!response.ok) {
        const error = data as ApiErrorResponse;

        throw new Error(
            error.message ??
            "Something went wrong. Please try again."
        );
    }

    return data as T;
}

export async function getStaffAccounts(): Promise<
    StaffAccount[]
> {
    const response = await fetch(STAFF_API_URL, {
        method: "GET",
        credentials: "include"
    });

    const data =
        await parseResponse<StaffListResponse>(
            response
        );

    return data.staff;
}

export async function createStaffAccount(
    input: CreateStaffInput
): Promise<StaffAccount> {
    const response = await fetch(STAFF_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(input)
    });

    const data =
        await parseResponse<StaffResponse>(response);

    return data.staff;
}

export async function changeStaffStatus(
    staffId: string,
    status: StaffStatus
): Promise<StaffAccount> {
    const response = await fetch(
        `${STAFF_API_URL}/${staffId}/status`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                status
            })
        }
    );

    const data =
        await parseResponse<StaffResponse>(response);

    return data.staff;
}

export async function resetStaffPassword(
    staffId: string,
    newPassword: string
): Promise<void> {
    const response = await fetch(
        `${STAFF_API_URL}/${staffId}/password`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                newPassword
            })
        }
    );

    await parseResponse<MessageResponse>(response);
}
export async function changeStockInPermission(
    staffId: string,
    canStockIn: boolean
): Promise<StaffAccount> {
    const response = await fetch(
        `${STAFF_API_URL}/${staffId}/stock-in-permission`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                canStockIn
            })
        }
    );

    const data =
        await parseResponse<StaffResponse>(response);

    return data.staff;
}