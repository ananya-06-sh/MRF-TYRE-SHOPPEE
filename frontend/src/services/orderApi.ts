import type {
    ConfirmBillInput,
    ConfirmedOrder
} from "../types/billing";

const ORDER_API_URL =
    "http://localhost:3000/api/v1/orders";

interface ApiErrorResponse {
    success: false;
    message?: string;
}

interface ConfirmBillResponse {
    success: true;
    message: string;
    order: ConfirmedOrder;
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

export async function confirmBill(
    input: ConfirmBillInput
): Promise<ConfirmedOrder> {
    const response = await fetch(
        ORDER_API_URL,
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
        await parseResponse<ConfirmBillResponse>(
            response
        );

    return data.order;
}