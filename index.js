// Available hCaptcha task types
const HCaptchaType = {
    BASIC: 'hcaptcha_basic',
    ENTERPRISE: 'hcaptcha_enterprise'
};

class RazorCapAPI {
    /**
     * Initialize the RazorCap API wrapper
     * @param {string} apiKey Your RazorCap API key
     */
    constructor(apiKey) {
        this.BASE_URL = 'https://api.razorcap.xyz';
        this.apiKey = apiKey;
    }

    /**
     * Create a new hCaptcha solving task
     * @param {Object} taskData Task configuration data
     * @param {string} taskData.sitekey Website's sitekey
     * @param {string} taskData.siteurl Website URL
     * @param {string} taskData.proxy Proxy in format http://user:pass@ip:port or ip:port
     * @param {string} [taskData.rqdata] Optional rqdata
     * @param {string} [taskType=HCaptchaType.BASIC] Type of hCaptcha task (BASIC or ENTERPRISE)
     * @returns {Promise<Object>} Promise containing task information
     */
    async createTask(taskData, taskType = HCaptchaType.BASIC) {
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
     * @param {number} taskId ID of the task to check
     * @returns {Promise<Object>} Promise containing task result
     */
    async getTaskResult(taskId) {
        const endpoint = `${this.BASE_URL}/get_result/${taskId}`;

        const response = await fetch(endpoint);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Wait for task completion with polling
     * @param {number} taskId ID of the task to check
     * @param {number} [maxAttempts=60] Maximum number of polling attempts
     * @param {number} [delay=5000] Delay between attempts in milliseconds
     * @returns {Promise<Object>} Promise containing final task result
     */
    async waitForResult(taskId, maxAttempts = 60, delay = 5000) {
        const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

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

module.exports = { RazorCapAPI, HCaptchaType };