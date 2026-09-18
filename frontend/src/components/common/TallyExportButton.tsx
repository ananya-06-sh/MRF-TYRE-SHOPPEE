import { useState } from "react";

interface TallyExportButtonProps {
    orderId: string;
    billNumber: string;
}

interface ApiErrorResponse {
    message?: string;
}

export default function TallyExportButton({
                                              orderId,
                                              billNumber
                                          }: TallyExportButtonProps) {
    const [isDownloading, setIsDownloading] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    async function handleDownload() {
        setIsDownloading(true);
        setErrorMessage(null);

        try {
            const response = await fetch(
                `http://localhost:3000/api/v1/tally-export/orders/${orderId}/xml`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            if (!response.ok) {
                const error =
                    (await response.json()) as
                        ApiErrorResponse;

                throw new Error(
                    error.message ??
                    "Unable to download Tally XML"
                );
            }

            const fileBlob = await response.blob();

            const downloadUrl =
                URL.createObjectURL(fileBlob);

            const contentDisposition =
                response.headers.get(
                    "Content-Disposition"
                );

            const fileNameMatch =
                contentDisposition?.match(
                    /filename="([^"]+)"/
                );

            const fileName =
                fileNameMatch?.[1] ??
                `${billNumber}-tally.xml`;

            const link =
                document.createElement("a");

            link.href = downloadUrl;
            link.download = fileName;

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(downloadUrl);
        } catch (error: unknown) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to download Tally XML"
            );
        } finally {
            setIsDownloading(false);
        }
    }

    return (
        <div>
            <button
                type="button"
                onClick={() => {
                    void handleDownload();
                }}
                disabled={isDownloading}
                className="w-full rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
                {isDownloading
                    ? "Preparing Tally XML..."
                    : "Download Tally XML"}
            </button>

            <p className="mt-2 text-xs text-slate-500">
                Download only. This does not mark the bill as
                synced.
            </p>

            {errorMessage && (
                <p className="mt-2 text-sm text-red-600">
                    {errorMessage}
                </p>
            )}
        </div>
    );
}