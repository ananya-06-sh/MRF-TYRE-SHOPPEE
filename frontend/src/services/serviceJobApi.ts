import type {
    CreateServiceJobInput,
    ServiceJob,
    ServiceJobStatus
} from "../types/serviceJob";

const SERVICE_JOB_API_URL =
    "http://localhost:3000/api/v1/service-jobs";

interface ApiErrorResponse {
    success: false;
    message?: string;
}

interface ServiceJobListResponse {
    success: true;
    jobs: ServiceJob[];
}

interface CreateServiceJobResponse {
    success: true;
    message: string;
    job: ServiceJob;
}

interface MessageResponse {
    success: true;
    message: string;
}

async function parseResponse<T>(
    response: Response
): Promise<T> {
    const data = (await response.json()) as
        | T
        | ApiErrorResponse;

    if (!response.ok) {
        const error = data as ApiErrorResponse;

        throw new Error(
            error.message ??
            "Something went wrong. Please try again."
        );
    }

    return data as T;
}

export async function getServiceJobs(): Promise<
    ServiceJob[]
> {
    const response = await fetch(
        SERVICE_JOB_API_URL,
        {
            method: "GET",
            credentials: "include"
        }
    );

    const data =
        await parseResponse<ServiceJobListResponse>(
            response
        );

    return data.jobs;
}

export async function createServiceJob(
    input: CreateServiceJobInput
): Promise<void> {
    const response = await fetch(
        SERVICE_JOB_API_URL,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(input)
        }
    );

    await parseResponse<CreateServiceJobResponse>(
        response
    );
}

export async function assignServiceTechnician(
    serviceJobId: string,
    assignedTechnician: string | null
): Promise<void> {
    const response = await fetch(
        `${SERVICE_JOB_API_URL}/${serviceJobId}/technician`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                assignedTechnician
            })
        }
    );

    await parseResponse<MessageResponse>(response);
}

export async function changeServiceJobStatus(
    serviceJobId: string,
    status: ServiceJobStatus
): Promise<void> {
    const response = await fetch(
        `${SERVICE_JOB_API_URL}/${serviceJobId}/status`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                status
            })
        }
    );

    await parseResponse<MessageResponse>(response);
}