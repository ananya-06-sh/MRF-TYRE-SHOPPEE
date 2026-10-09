import {
    useState,
    type FormEvent
} from "react";
import { Link } from "react-router-dom";
import {
    importInventoryCsv,
    InventoryImportApiError,
    type InventoryImportResult
} from "../../services/inventoryImportApi";

const SUPPORTED_EXTENSIONS = [
    ".csv",
    ".xlsx"
];

function getFileExtension(
    fileName: string
): string {
    const lastDotIndex =
        fileName.lastIndexOf(".");

    if (lastDotIndex < 0) {
        return "";
    }

    return fileName
        .slice(lastDotIndex)
        .toLowerCase();
}

function isSupportedFile(
    file: File
): boolean {
    return SUPPORTED_EXTENSIONS.includes(
        getFileExtension(file.name)
    );
}

function getFileTypeLabel(
    file: File
): string {
    return getFileExtension(
        file.name
    ) === ".xlsx"
        ? "Excel workbook"
        : "CSV file";
}

export default function InventoryImportPage() {
    const [selectedFile, setSelectedFile] =
        useState<File | null>(null);

    const [result, setResult] =
        useState<InventoryImportResult | null>(
            null
        );

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    const [
        validationIssues,
        setValidationIssues
    ] = useState<string[]>([]);

    const [isImporting, setIsImporting] =
        useState(false);

    const [fileInputKey, setFileInputKey] =
        useState(0);

    function resetMessages(): void {
        setResult(null);
        setErrorMessage(null);
        setValidationIssues([]);
    }

    function handleFileSelection(
        file: File | null
    ): void {
        resetMessages();

        if (!file) {
            setSelectedFile(null);
            return;
        }

        if (!isSupportedFile(file)) {
            setSelectedFile(null);

            setErrorMessage(
                "Select a valid .csv or .xlsx inventory file"
            );

            setFileInputKey(
                (currentKey) =>
                    currentKey + 1
            );

            return;
        }

        setSelectedFile(file);
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ): Promise<void> {
        event.preventDefault();

        if (!selectedFile) {
            setErrorMessage(
                "Select a CSV or Excel inventory file"
            );

            return;
        }

        if (!isSupportedFile(selectedFile)) {
            setErrorMessage(
                "Only .csv and .xlsx files are supported"
            );

            return;
        }

        setIsImporting(true);
        resetMessages();

        try {
            const importResult =
                await importInventoryCsv(
                    selectedFile
                );

            setResult(importResult);
            setSelectedFile(null);

            setFileInputKey(
                (currentKey) =>
                    currentKey + 1
            );
        } catch (error: unknown) {
            if (
                error instanceof
                InventoryImportApiError
            ) {
                setErrorMessage(
                    error.message
                );

                setValidationIssues(
                    error.issues
                );
            } else {
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Unable to import inventory"
                );
            }
        } finally {
            setIsImporting(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-100">
            <header className="border-b border-slate-200 bg-white p-4">
                <div className="mx-auto max-w-3xl">
                    <Link
                        to="/admin/inventory"
                        className="text-sm font-semibold text-red-600"
                    >
                        ← Inventory Management
                    </Link>

                    <h1 className="mt-2 text-2xl font-bold text-slate-900">
                        Import Inventory
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Upload inventory using an
                        Excel workbook or CSV file.
                    </p>
                </div>
            </header>

            <div className="mx-auto max-w-3xl space-y-5 p-4">
                <section className="rounded-2xl bg-white p-5 shadow-sm">
                    <h2 className="font-bold text-slate-900">
                        Prepare the spreadsheet
                    </h2>

                    <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
                        <li>
                            Download the template and
                            open it in Excel.
                        </li>

                        <li>
                            Enter one tyre product per
                            row without changing the
                            column headings.
                        </li>

                        <li>
                            Separate multiple compatible
                            vehicles using the{" "}
                            <strong>|</strong>{" "}
                            character.
                        </li>

                        <li>
                            Save the completed file as{" "}
                            <strong>
                                Excel Workbook (.xlsx)
                            </strong>{" "}
                            or{" "}
                            <strong>
                                CSV (.csv)
                            </strong>
                            .
                        </li>

                        <li>
                            For an Excel workbook, keep
                            the inventory in the first
                            worksheet and the headings
                            in the first row.
                        </li>
                    </ol>

                    <a
                        href="/inventory-import-template.csv"
                        download
                        className="mt-4 inline-block rounded-xl border border-red-300 px-4 py-3 font-semibold text-red-600 hover:bg-red-50"
                    >
                        Download Spreadsheet Template
                    </a>
                </section>

                <section className="rounded-2xl bg-white p-5 shadow-sm">
                    <h2 className="font-bold text-slate-900">
                        Upload Inventory File
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Supported formats: `.xlsx` and
                        `.csv`
                    </p>

                    <form
                        onSubmit={handleSubmit}
                        className="mt-4 space-y-4"
                    >
                        <input
                            key={fileInputKey}
                            type="file"
                            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            onChange={(event) =>
                                handleFileSelection(
                                    event.target
                                        .files?.[0] ??
                                    null
                                )
                            }
                            className="block w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm"
                        />

                        {selectedFile && (
                            <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
                                <p>
                                    Selected:{" "}
                                    <strong>
                                        {
                                            selectedFile.name
                                        }
                                    </strong>
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    {getFileTypeLabel(
                                        selectedFile
                                    )}{" "}
                                    ·{" "}
                                    {(
                                        selectedFile.size /
                                        1024
                                    ).toFixed(1)}{" "}
                                    KB
                                </p>
                            </div>
                        )}

                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                            Existing products with the
                            same product ID and billing
                            key will be updated. Stock
                            differences will be recorded
                            in the stock-movement history.
                        </div>

                        <button
                            type="submit"
                            disabled={
                                !selectedFile ||
                                isImporting
                            }
                            className="w-full rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                            {isImporting
                                ? "Importing inventory..."
                                : "Import Inventory"}
                        </button>
                    </form>
                </section>

                {errorMessage && (
                    <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
                        <h2 className="font-bold text-red-800">
                            Import failed
                        </h2>

                        <p className="mt-1 text-sm text-red-700">
                            {errorMessage}
                        </p>

                        {validationIssues.length >
                            0 && (
                                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-red-700">
                                    {validationIssues.map(
                                        (
                                            issue,
                                            index
                                        ) => (
                                            <li
                                                key={`${issue}-${index}`}
                                            >
                                                {issue}
                                            </li>
                                        )
                                    )}
                                </ul>
                            )}
                    </section>
                )}

                {result && (
                    <section className="rounded-2xl border border-green-200 bg-green-50 p-5">
                        <h2 className="font-bold text-green-800">
                            Inventory imported
                            successfully
                        </h2>

                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <ResultItem
                                label="Rows"
                                value={
                                    result.totalRows
                                }
                            />

                            <ResultItem
                                label="Created"
                                value={
                                    result.createdCount
                                }
                            />

                            <ResultItem
                                label="Updated"
                                value={
                                    result.updatedCount
                                }
                            />

                            <ResultItem
                                label="Stock changes"
                                value={
                                    result.stockMovementCount
                                }
                            />
                        </div>

                        <Link
                            to="/admin/inventory"
                            className="mt-5 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
                        >
                            View Inventory
                        </Link>
                    </section>
                )}
            </div>
        </main>
    );
}

interface ResultItemProps {
    label: string;
    value: number;
}

function ResultItem({
                        label,
                        value
                    }: ResultItemProps) {
    return (
        <div className="rounded-xl bg-white p-3 text-center">
            <p className="text-2xl font-bold text-slate-900">
                {value}
            </p>

            <p className="text-xs font-semibold text-slate-500">
                {label}
            </p>
        </div>
    );
}