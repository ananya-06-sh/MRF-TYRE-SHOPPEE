import { database } from "../config/database.js";
import {
    OrderStatus,
    ServiceJobStatus
} from "../generated/prisma/enums.js";

function startOfDay(date: Date): Date {
    return new Date(
        Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate()
        ) - 330 * 60 * 1000
    );
}

function endOfDay(date: Date): Date {
    return new Date(
        startOfDay(date).getTime() +
        24 * 60 * 60 * 1000 - 1
    );
}

export class AdminDashboardService {
    async getDashboard() {
        const today = new Date(
            Date.now() + 330 * 60 * 1000
        );
        const from = startOfDay(today);
        const to = endOfDay(today);

        const [sales, tyresSold, pendingJobs, inventory, recentOrders] =
            await Promise.all([
                database.order.aggregate({
                    where: {
                        status: {
                            not: OrderStatus.CANCELLED
                        },
                        createdAt: {
                            gte: from,
                            lte: to
                        }
                    },
                    _count: {
                        id: true
                    },
                    _sum: {
                        grandTotalPaise: true,
                        productsTotalPaise: true,
                        serviceTotalPaise: true
                    }
                }),
                database.orderItem.aggregate({
                    where: {
                        order: {
                            status: {
                                not: OrderStatus.CANCELLED
                            },
                            createdAt: {
                                gte: from,
                                lte: to
                            }
                        }
                    },
                    _sum: {
                        quantity: true
                    }
                }),
                database.serviceJob.count({
                    where: {
                        status: ServiceJobStatus.IN_PROGRESS,
                        OR: [
                            {
                                orderId: null
                            },
                            {
                                order: {
                                status: {
                                    not: OrderStatus.CANCELLED
                                }
                            }
                            }
                        ]
                    }
                }),
                database.inventoryItem.findMany({
                    where: {
                        isActive: true
                    },
                    select: {
                        currentStock: true,
                        lowStockTrigger: true
                    }
                }),
                database.order.findMany({
                    select: {
                        id: true,
                        billNumber: true,
                        status: true,
                        customerName: true,
                        grandTotalPaise: true,
                        createdAt: true
                    },
                    orderBy: {
                        createdAt: "desc"
                    },
                    take: 5
                })
            ]);

        return {
            today: {
                billCount: sales._count.id,
                salesPaise: sales._sum.grandTotalPaise ?? 0,
                productSalesPaise:
                    sales._sum.productsTotalPaise ?? 0,
                serviceSalesPaise:
                    sales._sum.serviceTotalPaise ?? 0,
                tyresSold: tyresSold._sum.quantity ?? 0
            },
            inventory: {
                activeProducts: inventory.length,
                outOfStock: inventory.filter(
                    (item) => item.currentStock === 0
                ).length,
                lowStock: inventory.filter(
                    (item) =>
                        item.currentStock > 0 &&
                        item.currentStock <= item.lowStockTrigger
                ).length
            },
            pendingServiceJobs: pendingJobs,
            recentOrders
        };
    }

    async getSalesReport(from: Date, to: Date) {
        return database.order.findMany({
            where: {
                createdAt: {
                    gte: startOfDay(from),
                    lte: endOfDay(to)
                }
            },
            select: {
                id: true,
                billNumber: true,
                status: true,
                customerName: true,
                customerMobile: true,
                vehiclePlateNumber: true,
                productsTotalPaise: true,
                serviceTotalPaise: true,
                includedTaxPaise: true,
                grandTotalPaise: true,
                createdAt: true,
                createdBy: {
                    select: {
                        displayName: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });
    }
}
