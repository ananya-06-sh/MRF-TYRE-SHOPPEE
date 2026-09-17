import { database } from "../config/database.js";

export class OrderHistoryService {
    async listOrders(searchText: string) {
        const normalizedSearch = searchText.trim();

        return database.order.findMany({
            where: normalizedSearch
                ? {
                    OR: [
                        {
                            billNumber: {
                                contains: normalizedSearch,
                                mode: "insensitive"
                            }
                        },
                        {
                            customerName: {
                                contains: normalizedSearch,
                                mode: "insensitive"
                            }
                        },
                        {
                            customerMobile: {
                                contains: normalizedSearch
                            }
                        },
                        {
                            vehiclePlateNumber: {
                                contains: normalizedSearch,
                                mode: "insensitive"
                            }
                        },
                        {
                            vehicleModel: {
                                contains: normalizedSearch,
                                mode: "insensitive"
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
                        loginIdentifier: true,
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

    async getOrderById(orderId: string) {
        return database.order.findUnique({
            where: {
                id: orderId
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
                        loginIdentifier: true,
                        role: true
                    }
                },

                items: {
                    select: {
                        id: true,
                        productIdSnapshot: true,
                        billingMatchKeySnapshot: true,
                        productNameSnapshot: true,
                        quantity: true,
                        standardUnitPricePaise: true,
                        billedUnitPricePaise: true,
                        gstRateBasisPoints: true,
                        includedTaxPaise: true,
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
                        serviceIdSnapshot: true,
                        serviceNameSnapshot: true,
                        quantity: true,
                        standardUnitPricePaise: true,
                        billedUnitPricePaise: true,
                        gstRateBasisPoints: true,
                        includedTaxPaise: true,
                        lineTotalPaise: true,
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
                        assignedTechnician: true,
                        status: true,
                        completedAt: true
                    }
                }
            }
        });
    }
}