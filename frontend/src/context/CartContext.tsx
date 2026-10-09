import {
    createContext,
    useContext,
    useMemo,
    useState,
    type ReactNode
} from "react";
import type { StaffTyre } from "../types/inventory";
import {
    calculateCartQuantity,
    calculateCartTotal,
    type CartItem,
    type SelectedService,
    type ShopService
} from "../types/order";

interface CartContextValue {
    items: CartItem[];
    selectedServices: SelectedService[];

    /**
     * Temporary compatibility value for older components.
     * It contains the first selected service.
     */
    selectedService: SelectedService | null;

    totalQuantity: number;
    totalPrice: number;

    addItem: (tyre: StaffTyre) => void;

    updateQuantity: (
        productId: string,
        quantity: number
    ) => void;

    removeItem: (productId: string) => void;

    toggleService: (
        service: ShopService
    ) => void;

    updateServiceQuantity: (
        serviceId: string,
        quantity: number
    ) => void;

    removeService: (
        serviceId: string
    ) => void;

    clearServices: () => void;

    /**
     * Kept temporarily so the current Billing page
     * continues compiling during the conversion.
     */
    selectService: (
        service: ShopService | null
    ) => void;

    clearCart: () => void;
}

const CartContext =
    createContext<CartContextValue | undefined>(
        undefined
    );

interface CartProviderProps {
    children: ReactNode;
}

export function CartProvider({
                                 children
                             }: CartProviderProps) {
    const [items, setItems] =
        useState<CartItem[]>([]);

    const [
        selectedServices,
        setSelectedServices
    ] = useState<SelectedService[]>([]);

    function addItem(tyre: StaffTyre): void {
        if (tyre.currentStock <= 0) {
            return;
        }

        setItems((currentItems) => {
            const existingItem =
                currentItems.find(
                    (item) =>
                        item.tyre.productId ===
                        tyre.productId
                );

            if (existingItem) {
                return currentItems.map(
                    (item) =>
                        item.tyre.productId ===
                        tyre.productId
                            ? {
                                ...item,
                                quantity: Math.min(
                                    item.quantity + 1,
                                    tyre.currentStock
                                )
                            }
                            : item
                );
            }

            return [
                ...currentItems,
                {
                    tyre,
                    quantity: 1
                }
            ];
        });
    }

    function updateQuantity(
        productId: string,
        quantity: number
    ): void {
        setItems((currentItems) =>
            currentItems.map((item) =>
                item.tyre.productId === productId
                    ? {
                        ...item,
                        quantity: Math.max(
                            1,
                            Math.min(
                                quantity,
                                item.tyre.currentStock
                            )
                        )
                    }
                    : item
            )
        );
    }

    function removeItem(
        productId: string
    ): void {
        setItems((currentItems) =>
            currentItems.filter(
                (item) =>
                    item.tyre.productId !==
                    productId
            )
        );
    }

    function toggleService(
        service: ShopService
    ): void {
        setSelectedServices(
            (currentServices) => {
                const alreadySelected =
                    currentServices.some(
                        (selected) =>
                            selected.service
                                .serviceId ===
                            service.serviceId
                    );

                if (alreadySelected) {
                    return currentServices.filter(
                        (selected) =>
                            selected.service
                                .serviceId !==
                            service.serviceId
                    );
                }

                return [
                    ...currentServices,
                    {
                        service,
                        quantity: 1
                    }
                ];
            }
        );
    }

    function updateServiceQuantity(
        serviceId: string,
        quantity: number
    ): void {
        setSelectedServices(
            (currentServices) =>
                currentServices.map(
                    (selected) =>
                        selected.service
                            .serviceId ===
                        serviceId
                            ? {
                                ...selected,
                                quantity:
                                    Math.max(
                                        1,
                                        Math.min(
                                            quantity,
                                            100
                                        )
                                    )
                            }
                            : selected
                )
        );
    }

    function removeService(
        serviceId: string
    ): void {
        setSelectedServices(
            (currentServices) =>
                currentServices.filter(
                    (selected) =>
                        selected.service
                            .serviceId !==
                        serviceId
                )
        );
    }

    function clearServices(): void {
        setSelectedServices([]);
    }

    function selectService(
        service: ShopService | null
    ): void {
        setSelectedServices(
            service
                ? [
                    {
                        service,
                        quantity: 1
                    }
                ]
                : []
        );
    }

    function clearCart(): void {
        setItems([]);
        setSelectedServices([]);
    }

    const selectedService =
        selectedServices[0] ?? null;

    const totalQuantity =
        calculateCartQuantity(items);

    const tyreTotal =
        calculateCartTotal(items);

    const serviceTotal =
        selectedServices.reduce(
            (total, selected) =>
                total +
                selected.service.sellingPrice *
                selected.quantity,
            0
        );

    const totalPrice =
        tyreTotal + serviceTotal;

    const value = useMemo(
        () => ({
            items,
            selectedServices,
            selectedService,
            totalQuantity,
            totalPrice,
            addItem,
            updateQuantity,
            removeItem,
            toggleService,
            updateServiceQuantity,
            removeService,
            clearServices,
            selectService,
            clearCart
        }),
        [
            items,
            selectedServices,
            selectedService,
            totalQuantity,
            totalPrice
        ]
    );

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart(): CartContextValue {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error(
            "useCart must be used inside CartProvider"
        );
    }

    return context;
}