import { database } from "../config/database.js";
import { environment } from "../config/environment.js";
import { OrderStatus } from "../generated/prisma/enums.js";

export type TallyXmlExportResult =
    | {
    success: true;
    fileName: string;
    xml: string;
}
    | {
    success: false;
    reason:
        | "ORDER_NOT_FOUND"
        | "ORDER_CANCELLED"
        | "NO_ORDER_LINES";
};

function escapeXml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}

function formatTallyDate(date: Date): string {
    const year = date
        .getUTCFullYear()
        .toString();

    const month = String(
        date.getUTCMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getUTCDate()
    ).padStart(2, "0");

    return `${year}${month}${day}`;
}

function formatRupees(paise: number): string {
    return (paise / 100).toFixed(2);
}

export class TallyXmlService {
    async generateOrderXml(
        orderId: string
    ): Promise<TallyXmlExportResult> {
        const order = await database.order.findUnique({
            where: {
                id: orderId
            },

            select: {
                billNumber: true,
                status: true,
                customerName: true,
                customerMobile: true,
                vehiclePlateNumber: true,
                vehicleModel: true,
                grandTotalPaise: true,
                createdAt: true,

                items: {
                    select: {
                        billingMatchKeySnapshot: true,
                        productNameSnapshot: true,
                        quantity: true,
                        billedUnitPricePaise: true,
                        lineTotalPaise: true
                    },

                    orderBy: {
                        createdAt: "asc"
                    }
                },

                services: {
                    select: {
                        serviceNameSnapshot: true,
                        quantity: true,
                        billedUnitPricePaise: true,
                        lineTotalPaise: true
                    },

                    orderBy: {
                        createdAt: "asc"
                    }
                }
            }
        });

        if (!order) {
            return {
                success: false,
                reason: "ORDER_NOT_FOUND"
            };
        }

        if (order.status === OrderStatus.CANCELLED) {
            return {
                success: false,
                reason: "ORDER_CANCELLED"
            };
        }

        if (
            order.items.length === 0 &&
            order.services.length === 0
        ) {
            return {
                success: false,
                reason: "NO_ORDER_LINES"
            };
        }

        const inventoryEntries = order.items
            .map((item) => {
                const itemName = escapeXml(
                    item.billingMatchKeySnapshot
                );

                const quantity =
                    `${item.quantity} nos`;

                const rate =
                    `${formatRupees(
                        item.billedUnitPricePaise
                    )}/nos`;

                const amount = formatRupees(
                    item.lineTotalPaise
                );

                return `
                <ALLINVENTORYENTRIES.LIST>
                    <STOCKITEMNAME>${itemName}</STOCKITEMNAME>
                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                    <RATE>${rate}</RATE>
                    <AMOUNT>${amount}</AMOUNT>
                    <ACTUALQTY>${quantity}</ACTUALQTY>
                    <BILLEDQTY>${quantity}</BILLEDQTY>

                    <BATCHALLOCATIONS.LIST>
                        <GODOWNNAME>Main Location</GODOWNNAME>
                        <BATCHNAME>Primary Batch</BATCHNAME>
                        <DESTINATIONGODOWNNAME>Main Location</DESTINATIONGODOWNNAME>
                        <AMOUNT>${amount}</AMOUNT>
                        <ACTUALQTY>${quantity}</ACTUALQTY>
                        <BILLEDQTY>${quantity}</BILLEDQTY>
                    </BATCHALLOCATIONS.LIST>

                    <ACCOUNTINGALLOCATIONS.LIST>
                        <LEDGERNAME>${escapeXml(
                    environment
                        .TALLY_SALES_LEDGER_NAME
                )}</LEDGERNAME>
                        <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                        <AMOUNT>${amount}</AMOUNT>
                    </ACCOUNTINGALLOCATIONS.LIST>
                </ALLINVENTORYENTRIES.LIST>`;
            })
            .join("");

        const serviceEntries = order.services
            .map((service) => {
                const amount = formatRupees(
                    service.lineTotalPaise
                );

                return `
                <ALLLEDGERENTRIES.LIST>
                    <LEDGERNAME>${escapeXml(
                    environment
                        .TALLY_SERVICE_LEDGER_NAME
                )}</LEDGERNAME>
                    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                    <ISPARTYLEDGER>No</ISPARTYLEDGER>
                    <AMOUNT>${amount}</AMOUNT>
                </ALLLEDGERENTRIES.LIST>`;
            })
            .join("");

        const customerDescription =
            order.customerName?.trim() ||
            "Walk-in customer";

        const narrationParts = [
            `MRF Shop bill ${order.billNumber}`,
            `Customer: ${customerDescription}`,
            order.customerMobile
                ? `Mobile: ${order.customerMobile}`
                : null,
            order.vehiclePlateNumber
                ? `Vehicle: ${order.vehiclePlateNumber}`
                : null,
            order.vehicleModel
                ? `Model: ${order.vehicleModel}`
                : null
        ].filter(
            (value): value is string =>
                value !== null
        );

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
    <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Import</TALLYREQUEST>
        <TYPE>Data</TYPE>
        <ID>Vouchers</ID>
    </HEADER>

    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>Vouchers</REPORTNAME>

                <STATICVARIABLES>
                    <SVCURRENTCOMPANY>${escapeXml(
            environment.TALLY_COMPANY_NAME
        )}</SVCURRENTCOMPANY>
                </STATICVARIABLES>
            </REQUESTDESC>

            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
                    <VOUCHER
                        VCHTYPE="Sales"
                        ACTION="Create"
                        OBJVIEW="Invoice Voucher View"
                    >
                        <DATE>${formatTallyDate(
            order.createdAt
        )}</DATE>

                        <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
                        <VOUCHERNUMBER>${escapeXml(
            order.billNumber
        )}</VOUCHERNUMBER>

                        <REFERENCE>${escapeXml(
            order.billNumber
        )}</REFERENCE>

                        <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
                        <ISINVOICE>Yes</ISINVOICE>

                        <NARRATION>${escapeXml(
            narrationParts.join(" | ")
        )}</NARRATION>

                        <ALLLEDGERENTRIES.LIST>
                            <LEDGERNAME>${escapeXml(
            environment
                .TALLY_CASH_LEDGER_NAME
        )}</LEDGERNAME>

                            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                            <ISPARTYLEDGER>Yes</ISPARTYLEDGER>
                            <ISLASTDEEMEDPOSITIVE>Yes</ISLASTDEEMEDPOSITIVE>

                            <AMOUNT>-${formatRupees(
            order.grandTotalPaise
        )}</AMOUNT>
                        </ALLLEDGERENTRIES.LIST>

                        ${serviceEntries}
                        ${inventoryEntries}
                    </VOUCHER>
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;

        const safeBillNumber =
            order.billNumber.replace(
                /[^a-zA-Z0-9_-]/g,
                "_"
            );

        return {
            success: true,
            fileName:
                `${safeBillNumber}-tally.xml`,
            xml
        };
    }
}