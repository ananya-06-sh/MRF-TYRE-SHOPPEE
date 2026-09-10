import type {
    StaffProductDto
} from "../dtos/StaffProductDto.js";
import {
    InventoryRepository
} from "../repositories/InventoryRepository.js";

export class CatalogueService {
    private readonly inventoryRepository =
        new InventoryRepository();

    async search(
        searchText?: string
    ): Promise<StaffProductDto[]> {
        const products =
            await this.inventoryRepository.findAllForStaff();

        const query = searchText?.trim().toLowerCase();

        if (!query) {
            return products;
        }

        return products.filter((product) => {
            const searchableText = [
                product.productId,
                product.patternAndSize,
                product.category,
                ...product.compatibleVehicles
            ]
                .join(" ")
                .toLowerCase();

            return searchableText.includes(query);
        });
    }
}