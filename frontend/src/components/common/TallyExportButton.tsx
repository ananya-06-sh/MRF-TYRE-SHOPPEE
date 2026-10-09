import { useState } from "react";
import { Link } from "react-router-dom";

interface TallyExportButtonProps {
    orderId: string;
    billNumber: string;
    allowTallyExport?: boolean;
}

interface ApiErrorResponse {
    message?: string;
}

const TALLY_EXPORT_API_URL =
    "/api/v1/tally-export";

export default function TallyExportButton({
                                              orderId,
                                              billNumber,
                                              allowTallyExport = true
                                          }: TallyExportButtonProps) {
    const [
        isDownloading,
        setIsDownloading
    ] = useState(false);

    const [
        errorMessage,
        setErrorMessage
    ] = useState<string | null>(null);

    async function handleDownload(): Promise<void> {
        setIsDownloading(true);
        setErrorMessage(null);

        try {
            const response = await fetch(
                `${TALLY_EXPORT_API_URL}/orders/${orderId}/xml`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            if (!response.ok) {
                let message =
                    "Unable to download Tally XML";

                try {
                    const error =
                        (await response.json()) as
                            ApiErrorResponse;

                    message =
                        error.message ??
                        message;
                } catch {
                    // Keep the fallback message when
                    // the server response is not JSON.
                }

                throw new Error(message);
            }

            const fileBlob =
                await response.blob();

            const downloadUrl =
                URL.createObjectURL(
                    fileBlob
                );

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

            URL.revokeObjectURL(
                downloadUrl
            );
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
            <div
                className={`grid gap-3 ${
                    allowTallyExport
                        ? "sm:grid-cols-2"
                        : ""
                }`}
            >
                <Link
                    to={`/admin/orders/${orderId}/print`}
                    className="rounded-xl bg-red-600 px-5 py-3 text-center font-semibold text-white hover:bg-red-700"
                >
                    Print Customer Bill
                </Link>

                {allowTallyExport && (
                    <button
                        type="button"
                        onClick={() => {
                            void handleDownload();
                        }}
                        disabled={isDownloading}
                        className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                    >
                        {isDownloading
                            ? "Preparing Tally XML..."
                            : "Download Tally XML"}
                    </button>
                )}
            </div>

            {allowTallyExport && (
                <p className="mt-2 text-xs text-slate-500">
                    Tally export is download-only. It does
                    not mark the bill as synced.
                </p>
            )}

            {errorMessage && (
                <p className="mt-2 text-sm text-red-600">
                    {errorMessage}
                </p>
            )}
        </div>
    );
}
