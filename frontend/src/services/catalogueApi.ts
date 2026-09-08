import type { StaffTyre } from "../types/inventory";

interface CatalogueSearchResponse {
    success: boolean;
    count: number;
    products: StaffTyre[];
}

const API_BASE_URL = "http://localhost:3000/api/v1";

export async function searchCatalogue(
    searchText = ""
): Promise<StaffTyre[]> {
    const query = new URLSearchParams();

    if (searchText.trim()) {
        query.set("q", searchText.trim());
    }

    const queryString = query.toString();
    const url = `${API_BASE_URL}/catalogue/search${
        queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Catalogue request failed with status ${response.status}`
        );
    }

    const data =
        (await response.json()) as CatalogueSearchResponse;

    return data.products;
}