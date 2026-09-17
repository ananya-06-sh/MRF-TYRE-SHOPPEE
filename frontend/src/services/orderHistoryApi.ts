import type {
    OrderHistoryDetail,
    OrderHistorySummary
} from "../types/orderHistory";

const ORDER_HISTORY_API_URL =
    "http://localhost:3000/api/v1/order-history";

interface ApiErrorResponse {
    success: false;
    message?: string;
}

interface OrderHistoryListResponse {
    success: true;
    orders: OrderHistorySummary[];
}

interface OrderHistoryDetailResponse {
    success: true;
    order: OrderHistoryDetail;
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

export async function getOrderHistory(
    searchText = ""
): Promise<OrderHistorySummary[]> {
    const parameters = new URLSearchParams();

    if (searchText.trim()) {
        parameters.set(
            "search",
            searchText.trim()
        );
    }

    const queryString = parameters.toString();

    const response = await fetch(
        `${ORDER_HISTORY_API_URL}${
            queryString ? `?${queryString}` : ""
        }`,
        {
            method: "GET",
            credentials: "include"
        }
    );

    const data =
        await parseResponse<OrderHistoryListResponse>(
            response
        );

    return data.orders;
}

export async function getOrderHistoryById(
    orderId: string
): Promise<OrderHistoryDetail> {
    const response = await fetch(
        `${ORDER_HISTORY_API_URL}/${orderId}`,
        {
            method: "GET",
            credentials: "include"
        }
    );

    const data =
        await parseResponse<OrderHistoryDetailResponse>(
            response
        );

    return data.order;
}