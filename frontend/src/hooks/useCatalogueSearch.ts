import { useEffect, useState } from "react";
import { searchCatalogue } from "../services/catalogueApi";
import type { StaffTyre } from "../types/inventory";

interface CatalogueSearchState {
    tyres: StaffTyre[];
    isLoading: boolean;
    errorMessage: string | null;
}

export function useCatalogueSearch(
    searchText: string
): CatalogueSearchState {
    const [tyres, setTyres] = useState<StaffTyre[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    useEffect(() => {
        let isCancelled = false;

        const timer = window.setTimeout(async () => {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const products =
                    await searchCatalogue(searchText);

                if (!isCancelled) {
                    setTyres(products);
                }
            } catch {
                if (!isCancelled) {
                    setTyres([]);
                    setErrorMessage(
                        "Unable to load inventory. Check that the backend is running."
                    );
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        }, 250);

        return () => {
            isCancelled = true;
            window.clearTimeout(timer);
        };
    }, [searchText]);

    return {
        tyres,
        isLoading,
        errorMessage
    };
}