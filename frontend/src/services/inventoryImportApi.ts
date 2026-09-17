export interface InventoryImportResult {
    totalRows: number;
    createdCount: number;
    updatedCount: number;
    stockMovementCount: number;
}

interface SuccessfulImportResponse {
    success: true;
    message: string;
    result: InventoryImportResult;
}

interface FailedImportResponse {
    success: false;
    message?: string;
    issues?: string[];
}

const INVENTORY_IMPORT_URL =
    "http://localhost:3000/api/v1/inventory-import/csv";

export class InventoryImportApiError extends Error {
    constructor(
        message: string,
        public readonly issues: string[] = []
    ) {
        super(message);
    }
}

export async function importInventoryCsv(
    file: File
): Promise<InventoryImportResult> {
    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch(
        INVENTORY_IMPORT_URL,
        {
            method: "POST",
            credentials: "include",
            body: formData
        }
    );

    const data = (await response.json()) as
        | SuccessfulImportResponse
        | FailedImportResponse;

    if (!response.ok || !data.success) {
        const error =
            data as FailedImportResponse;

        throw new InventoryImportApiError(
            error.message ??
            "Unable to import inventory",
            error.issues ?? []
        );
    }

    return data.result;
}