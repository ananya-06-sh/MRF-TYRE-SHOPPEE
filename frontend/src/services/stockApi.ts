import type {
    AdminInventoryItem,
    StaffStockInItem,
    StockInInput
} from "../types/adminInventory";

const STOCK_API_URL =
    "http://localhost:3000/api/v1/admin/stock";

interface ApiErrorResponse {
    success: false;
    message?: string;
}

interface InventoryResponse {
    success: true;
    inventory: AdminInventoryItem[];
}

interface StaffStockInItemsResponse {
    success: true;
    inventory: StaffStockInItem[];
}

interface StockInResponse {
    success: true;
    message: string;
    inventoryItem: {
        id: string;
        productId: string;
        patternAndSize: string;
        currentStock: number;
        baseCostPaise: number;
        finalSellingPricePaise: number;
    };
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

export async function getAdminInventory(): Promise<
    AdminInventoryItem[]
> {
    const response = await fetch(
        `${STOCK_API_URL}/inventory`,
        {
            method: "GET",
            credentials: "include"
        }
    );

    const data =
        await parseResponse<InventoryResponse>(
            response
        );

    return data.inventory;
}

export async function addStock(
    input: StockInInput
): Promise<StockInResponse["inventoryItem"]> {
    const response = await fetch(
        `${STOCK_API_URL}/stock-in`,
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
        await parseResponse<StockInResponse>(
            response
        );

    return data.inventoryItem;
}
export async function getStaffStockInItems(): Promise<
    StaffStockInItem[]
> {
    const response = await fetch(
        `${STOCK_API_URL}/items`,
        {
            method: "GET",
            credentials: "include"
        }
    );

    const data =
        await parseResponse<StaffStockInItemsResponse>(
            response
        );

    return data.inventory;
}