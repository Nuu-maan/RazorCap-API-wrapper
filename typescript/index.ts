enum HCaptchaType {
    BASIC = 'hcaptcha_basic',
    ENTERPRISE = 'hcaptcha_enterprise'
}

interface HCaptchaTaskData {
    sitekey: string;
    siteurl: string;
    proxy: string;
    rqdata?: string;
}

interface CreateTaskResponse {
    price: string;
    status: string;
    task_id: number;
}

interface TaskResult {
    response_key?: string;
    status: 'solved' | 'solving' | 'error';
    error?: string;
}

export class RazorCapAPI {
    private readonly BASE_URL = 'https://api.razorcap.xyz';
    private readonly apiKey: string;

    /**
     * Initialize the RazorCap API wrapper
     * @param apiKey Your RazorCap API key
     */
    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Create a new hCaptcha solving task
     * @param taskData Task configuration data
     * @param taskType Type of hCaptcha task (BASIC or ENTERPRISE)
     * @returns Promise containing task information
     */
    async createTask(
        taskData: HCaptchaTaskData,
        taskType: HCaptchaType = HCaptchaType.BASIC
    ): Promise<CreateTaskResponse> {
        const endpoint = `${this.BASE_URL}/create_task`;

        const payload = {
            key: this.apiKey,
            type: taskType,
            data: {
                sitekey: taskData.sitekey,
                siteurl: taskData.siteurl,
                proxy: taskData.proxy,
                ...(taskData.rqdata && { rqdata: taskData.rqdata })
            }
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Get the result of a specific task
     * @param taskId ID of the task to check
     * @returns Promise containing task result
     */
    async getTaskResult(taskId: number): Promise<TaskResult> {
        const endpoint = `${this.BASE_URL}/get_result/${taskId}`;

        const response = await fetch(endpoint);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Wait for task completion with polling
     * @param taskId ID of the task to check
     * @param maxAttempts Maximum number of polling attempts
     * @param delay Delay between attempts in milliseconds
     * @returns Promise containing final task result
     */
    async waitForResult(
        taskId: number,
        maxAttempts: number = 60,
        delay: number = 5000
    ): Promise<TaskResult> {
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const result = await this.getTaskResult(taskId);

            if (result.status === 'solved') {
                return result;
            }

            if (result.status === 'error') {
                throw new Error(`Task failed: ${result.error || 'Unknown error'}`);
            }

            await sleep(delay);
        }

        throw new Error(`Task ${taskId} did not complete within the allowed time`);
    }
}