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
    selectedService: SelectedService | null;
    totalQuantity: number;
    totalPrice: number;
    addItem: (tyre: StaffTyre) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    removeItem: (productId: string) => void;
    selectService: (service: ShopService | null) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(
    undefined
);

interface CartProviderProps {
    children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [selectedService, setSelectedService] =
        useState<SelectedService | null>(null);

    function addItem(tyre: StaffTyre) {
        setItems((currentItems) => {
            const existingItem = currentItems.find(
                (item) => item.tyre.productId === tyre.productId
            );

            if (existingItem) {
                return currentItems.map((item) =>
                    item.tyre.productId === tyre.productId
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

            return [...currentItems, { tyre, quantity: 1 }];
        });
    }

    function updateQuantity(productId: string, quantity: number) {
        setItems((currentItems) =>
            currentItems.map((item) =>
                item.tyre.productId === productId
                    ? {
                        ...item,
                        quantity: Math.max(
                            1,
                            Math.min(quantity, item.tyre.currentStock)
                        )
                    }
                    : item
            )
        );
    }

    function removeItem(productId: string) {
        setItems((currentItems) =>
            currentItems.filter(
                (item) => item.tyre.productId !== productId
            )
        );
    }

    function selectService(service: ShopService | null) {
        setSelectedService(
            service
                ? {
                    service,
                    quantity: 1
                }
                : null
        );
    }

    function clearCart() {
        setItems([]);
        setSelectedService(null);
    }

    const totalQuantity = calculateCartQuantity(items);
    const tyreTotal = calculateCartTotal(items);
    const serviceTotal = selectedService
        ? selectedService.service.sellingPrice *
        selectedService.quantity
        : 0;

    const value = useMemo(
        () => ({
            items,
            selectedService,
            totalQuantity,
            totalPrice: tyreTotal + serviceTotal,
            addItem,
            updateQuantity,
            removeItem,
            selectService,
            clearCart
        }),
        [
            items,
            selectedService,
            totalQuantity,
            tyreTotal,
            serviceTotal
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
        throw new Error("useCart must be used inside CartProvider");
    }

    return context;
}