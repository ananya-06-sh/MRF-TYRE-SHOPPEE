import { database } from "../config/database.js";
import {
    OrderStatus,
    StockMovementType
} from "../generated/prisma/enums.js";

export type CancelOrderResult =
    | {
    success: true;
    alreadyCancelled: boolean;
    restoredQuantity: number;
}
    | {
    success: false;
    reason:
        | "ORDER_NOT_FOUND"
        | "TALLY_SYNCED";
};

export class OrderHistoryService {
    async cancelOrder(
        orderId: string,
        performedById: string
    ): Promise<CancelOrderResult> {
        return database.$transaction(
            async (transaction) => {
                await transaction.$queryRaw`
                    SELECT "id"
                    FROM "Order"
                    WHERE "id" = ${orderId}::uuid
                    FOR UPDATE
                `;

                const order =
                    await transaction.order.findUnique({
                        where: {
                            id: orderId
                        },
                        select: {
                            id: true,
                            status: true,
                            billNumber: true,
                            items: {
                                select: {
                                    inventoryItemId: true,
                                    quantity: true,
                                    baseCostPaiseSnapshot:
                                        true
                                }
                            }
                        }
                    });

                if (!order) {
                    return {
                        success: false,
                        reason:
                            "ORDER_NOT_FOUND"
                    };
                }

                if (
                    order.status ===
                    OrderStatus.TALLY_SYNCED
                ) {
                    return {
                        success: false,
                        reason: "TALLY_SYNCED"
                    };
                }

                const alreadyCancelled =
                    order.status ===
                    OrderStatus.CANCELLED;

                if (!alreadyCancelled) {
                    await transaction.order.update({
                        where: {
                            id: order.id
                        },
                        data: {
                            status:
                            OrderStatus.CANCELLED
                        }
                    });
                }

                let restoredQuantity = 0;

                for (const item of order.items) {
                    const restoredForItem =
                        await transaction
                            .stockMovement
                            .aggregate({
                                where: {
                                    orderId: order.id,
                                    inventoryItemId:
                                    item.inventoryItemId,
                                    type:
                                    StockMovementType
                                        .CUSTOMER_RETURN
                                },
                                _sum: {
                                    quantityChange: true
                                }
                            });

                    const quantityAlreadyRestored =
                        Math.max(
                            0,
                            restoredForItem._sum
                                .quantityChange ?? 0
                        );

                    const quantityToRestore =
                        Math.max(
                            0,
                            item.quantity -
                            quantityAlreadyRestored
                        );

                    if (quantityToRestore === 0) {
                        continue;
                    }

                    const updatedInventory =
                        await transaction
                            .inventoryItem
                            .update({
                                where: {
                                    id:
                                    item.inventoryItemId
                                },
                                data: {
                                    currentStock: {
                                        increment:
                                        quantityToRestore
                                    },
                                    version: {
                                        increment: 1
                                    }
                                },
                                select: {
                                    currentStock: true
                                }
                            });

                    await transaction
                        .stockMovement
                        .create({
                            data: {
                                inventoryItemId:
                                item.inventoryItemId,
                                performedById,
                                orderId: order.id,
                                type:
                                StockMovementType
                                    .CUSTOMER_RETURN,
                                quantityChange:
                                quantityToRestore,
                                stockBefore:
                                updatedInventory
                                    .currentStock -
                                quantityToRestore,
                                stockAfter:
                                updatedInventory
                                    .currentStock,
                                unitCostPaise:
                                item.baseCostPaiseSnapshot,
                                referenceNumber:
                                order.billNumber,
                                note:
                                    alreadyCancelled
                                        ? "Missing stock restored for a previously cancelled bill"
                                        : "Stock restored because the bill was cancelled"
                            }
                        });

                    restoredQuantity +=
                        quantityToRestore;
                }

                return {
                    success: true,
                    alreadyCancelled,
                    restoredQuantity
                };
            }
        );
    }

    async listOrders(
        searchText: string
    ) {
        const normalizedSearch =
            searchText.trim();

        return database.order.findMany({
            where: normalizedSearch
                ? {
                    OR: [
                        {
                            billNumber: {
                                contains:
                                normalizedSearch,
                                mode:
                                    "insensitive"
                            }
                        },
                        {
                            customerName: {
                                contains:
                                normalizedSearch,
                                mode:
                                    "insensitive"
                            }
                        },
                        {
                            customerMobile: {
                                contains:
                                normalizedSearch
                            }
                        },
                        {
                            vehiclePlateNumber: {
                                contains:
                                normalizedSearch,
                                mode:
                                    "insensitive"
                            }
                        },
                        {
                            vehicleModel: {
                                contains:
                                normalizedSearch,
                                mode:
                                    "insensitive"
                            }
                        }
                    ]
                }
                : undefined,

            select: {
                id: true,
                billNumber: true,
                status: true,
                customerName: true,
                customerMobile: true,
                vehiclePlateNumber: true,
                vehicleModel: true,
                productsTotalPaise: true,
                serviceTotalPaise: true,
                includedTaxPaise: true,
                grandTotalPaise: true,
                tallyVoucherId: true,
                tallySyncedAt: true,
                createdAt: true,

                createdBy: {
                    select: {
                        id: true,
                        displayName: true,
                        loginIdentifier:
                            true,
                        role: true
                    }
                },

                _count: {
                    select: {
                        items: true,
                        services: true
                    }
                }
            },

            orderBy: {
                createdAt: "desc"
            },

            take: 100
        });
    }

    async getOrderById(
        orderId: string,
        requestingUserId: string,
        canViewAllOrders: boolean
    ) {
        return database.order.findFirst({
            where: {
                id: orderId,

                ...(canViewAllOrders
                    ? {}
                    : {
                        createdById:
                        requestingUserId
                    })
            },

            select: {
                id: true,
                billNumber: true,
                status: true,
                customerName: true,
                customerMobile: true,
                vehiclePlateNumber: true,
                vehicleModel: true,
                productsTotalPaise: true,
                serviceTotalPaise: true,
                includedTaxPaise: true,
                grandTotalPaise: true,
                tallyVoucherId: true,
                tallySyncedAt: true,
                createdAt: true,
                updatedAt: true,

                createdBy: {
                    select: {
                        id: true,
                        displayName: true,
                        loginIdentifier:
                            true,
                        role: true
                    }
                },

                items: {
                    select: {
                        id: true,
                        productIdSnapshot:
                            true,
                        billingMatchKeySnapshot:
                            true,
                        productNameSnapshot:
                            true,
                        quantity: true,
                        standardUnitPricePaise:
                            true,
                        billedUnitPricePaise:
                            true,
                        gstRateBasisPoints:
                            true,
                        includedTaxPaise:
                            true,
                        lineTotalPaise: true,
                        createdAt: true
                    },

                    orderBy: {
                        createdAt: "asc"
                    }
                },

                services: {
                    select: {
                        id: true,
                        serviceIdSnapshot:
                            true,
                        serviceNameSnapshot:
                            true,
                        serviceTypeSnapshot:
                            true,
                        quantity: true,
                        standardUnitPricePaise:
                            true,
                        billedUnitPricePaise:
                            true,
                        gstRateBasisPoints:
                            true,
                        includedTaxPaise:
                            true,
                        lineTotalPaise:
                            true,
                        createdAt: true
                    },

                    orderBy: {
                        createdAt: "asc"
                    }
                },

                serviceJob: {
                    select: {
                        id: true,
                        jobNumber: true,
                        serviceType: true,
                        serviceNames: true,
                        assignedTechnician:
                            true,
                        status: true,
                        completedAt: true
                    }
                }
            }
        });
    }
}
