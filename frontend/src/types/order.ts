import type { StaffTyre } from "./inventory";

export interface CartItem {
    tyre: StaffTyre;
    quantity: number;
}

export interface CartState {
    items: CartItem[];
}

export function calculateCartItemTotal(
    item: CartItem
): number {
    return (
        item.tyre.finalSellingPrice *
        item.quantity
    );
}

export function calculateCartTotal(
    items: CartItem[]
): number {
    return items.reduce(
        (total, item) =>
            total +
            calculateCartItemTotal(item),
        0
    );
}

export function calculateCartQuantity(
    items: CartItem[]
): number {
    return items.reduce(
        (total, item) =>
            total + item.quantity,
        0
    );
}

export type ServiceType =
    | "ALIGNMENT"
    | "BALANCING"
    | "BOTH"
    | "OTHER";

export interface ShopService {
    serviceId: string;
    serviceType: ServiceType;
    name: string;
    description: string;
    sellingPrice: number;
    gstRatePercent: number;
    createsServiceJob?: boolean;
}

export interface SelectedService {
    service: ShopService;
    quantity: number;
}