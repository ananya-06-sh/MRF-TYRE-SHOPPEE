import type {
    ServiceCatalogueInput,
    ServiceCatalogueItem
} from "../types/serviceCatalogue";

const SERVICE_CATALOGUE_API_URL =
    "/api/v1/services";

interface ApiErrorResponse {
    success: false;
    message?: string;
}

interface ServiceListResponse {
    success: true;
    services: ServiceCatalogueItem[];
}

interface ServiceResponse {
    success: true;
    message: string;
    service: ServiceCatalogueItem;
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

export async function getActiveServices(): Promise<
    ServiceCatalogueItem[]
> {
    const response = await fetch(
        SERVICE_CATALOGUE_API_URL,
        {
            method: "GET",
            credentials: "include"
        }
    );

    const data =
        await parseResponse<ServiceListResponse>(
            response
        );

    return data.services;
}

export async function getAdminServices(): Promise<
    ServiceCatalogueItem[]
> {
    const response = await fetch(
        `${SERVICE_CATALOGUE_API_URL}/admin`,
        {
            method: "GET",
            credentials: "include"
        }
    );

    const data =
        await parseResponse<ServiceListResponse>(
            response
        );

    return data.services;
}

export async function createService(
    input: ServiceCatalogueInput
): Promise<ServiceCatalogueItem> {
    const response = await fetch(
        `${SERVICE_CATALOGUE_API_URL}/admin`,
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
        await parseResponse<ServiceResponse>(
            response
        );

    return data.service;
}

export async function updateService(
    serviceCatalogueItemId: string,
    input: ServiceCatalogueInput
): Promise<ServiceCatalogueItem> {
    const response = await fetch(
        `${SERVICE_CATALOGUE_API_URL}/admin/${serviceCatalogueItemId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(input)
        }
    );

    const data =
        await parseResponse<ServiceResponse>(
            response
        );

    return data.service;
}

export async function changeServiceStatus(
    serviceCatalogueItemId: string,
    isActive: boolean
): Promise<ServiceCatalogueItem> {
    const response = await fetch(
        `${SERVICE_CATALOGUE_API_URL}/admin/${serviceCatalogueItemId}/status`,
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

    const data =
        await parseResponse<ServiceResponse>(
            response
        );

    return data.service;
}