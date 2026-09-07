const inrFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
});

export function formatInr(amount: number): string {
    return inrFormatter.format(amount);
}
export interface InclusiveTaxBreakdown {
    taxableAmount: number;
    taxAmount: number;
    totalAmount: number;
}

export function calculateIncludedTax(
    totalAmount: number,
    taxRatePercent: number
): InclusiveTaxBreakdown {
    const taxableAmount =
        totalAmount / (1 + taxRatePercent / 100);

    const taxAmount = totalAmount - taxableAmount;

    return {
        taxableAmount,
        taxAmount,
        totalAmount
    };
}