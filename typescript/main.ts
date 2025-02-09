import { RazorCapAPI, HCaptchaType } from './razorcap';

// Replace with your actual API key
const API_KEY = 'YOUR_API_KEY_HERE';

// Example task data
const taskData: TaskData = {
    sitekey: 'SITEKEY_HERE', // Replace with the target site's hCaptcha sitekey
    siteurl: 'https://example.com', // Replace with the target website URL
    proxy: 'http://user:pass@ip:port', // Replace with your proxy details
    rqdata: 'optional_rqdata_here' // Optional, only if required
};

// Initialize the API client
const api = new RazorCapAPI(API_KEY);

// Asynchronous example
async function solveCaptcha() {
    try {
        // Create a new hCaptcha task
        const task = await api.createTask(taskData, HCaptchaType.BASIC);
        console.log(`Task created! Task ID: ${task.task_id}`);

        // Wait for the result asynchronously
        const result = await api.waitForResult(task.task_id);
        console.log('Captcha solved!');
        console.log(`Captcha token: ${result.response_key}`);
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Run the example
solveCaptcha();