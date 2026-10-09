export interface AdminDashboardData {
    today: {
        billCount: number;
        salesPaise: number;
        productSalesPaise: number;
        serviceSalesPaise: number;
        tyresSold: number;
    };
    inventory: {
        activeProducts: number;
        outOfStock: number;
        lowStock: number;
    };
    pendingServiceJobs: number;
    recentOrders: Array<{
        id: string;
        billNumber: string;
        status: "CONFIRMED" | "TALLY_SYNCED" | "CANCELLED";
        customerName: string | null;
        grandTotalPaise: number;
        createdAt: string;
    }>;
}

interface DashboardResponse {
    success: true;
    dashboard: AdminDashboardData;
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
    const response = await fetch("/api/v1/admin/dashboard", {
        credentials: "include"
    });

    const data = await response.json() as
        | DashboardResponse
        | { success: false; message?: string };

    if (!response.ok || !data.success) {
        throw new Error(
            "message" in data && data.message
                ? data.message
                : "Unable to load dashboard"
        );
    }

    return data.dashboard;
}

export async function downloadSalesReport(
    from: string,
    to: string
): Promise<void> {
    const parameters = new URLSearchParams({
        from,
        to,
        format: "csv"
    });
    const response = await fetch(
        `/api/v1/admin/dashboard/sales-report?${parameters}`,
        { credentials: "include" }
    );

    if (!response.ok) {
        const data = await response.json() as { message?: string };
        throw new Error(data.message ?? "Unable to download report");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-${from}-to-${to}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
