import type {
    AdminInventoryItem,
    CreateInventoryInput,
    UpdateInventoryInput
} from "../types/adminInventory";

const ADMIN_INVENTORY_API_URL =
    "http://localhost:3000/api/v1/admin/inventory";

interface ApiErrorResponse {
    success: false;
    message?: string;
}

interface InventoryListResponse {
    success: true;
    inventory: AdminInventoryItem[];
}

interface CreateInventoryResponse {
    success: true;
    message: string;
    inventoryItemId: string;
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

export async function getAdminInventoryItems(): Promise<
    AdminInventoryItem[]
> {
    const response = await fetch(
        ADMIN_INVENTORY_API_URL,
        {
            method: "GET",
            credentials: "include"
        }
    );

    const data =
        await parseResponse<InventoryListResponse>(
            response
        );

    return data.inventory;
}

export async function createInventoryItem(
    input: CreateInventoryInput
): Promise<string> {
    const response = await fetch(
        ADMIN_INVENTORY_API_URL,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(input)
        }
    );

    const data =
        await parseResponse<CreateInventoryResponse>(
            response
        );

    return data.inventoryItemId;
}

export async function updateInventoryItem(
    inventoryItemId: string,
    input: UpdateInventoryInput
): Promise<void> {
    const response = await fetch(
        `${ADMIN_INVENTORY_API_URL}/${inventoryItemId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(input)
        }
    );

    await parseResponse<MessageResponse>(response);
}

export async function changeInventoryActiveStatus(
    inventoryItemId: string,
    isActive: boolean
): Promise<void> {
    const response = await fetch(
        `${ADMIN_INVENTORY_API_URL}/${inventoryItemId}/active`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                isActive
            })
        }
    );

    await parseResponse<MessageResponse>(response);
}