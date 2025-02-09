const { RazorCapAPI, HCaptchaType } = require('./razorcap');

// Initialize with your API key
const api = new RazorCapAPI('YOUR_API_KEY_HERE');

async function solveCaptcha() {
    try {
        // Create a new hCaptcha task
        const task = await api.createTask(
            {
                sitekey: 'a9b5fb07-92ff-493f-86fe-352a2803b3df',
                siteurl: 'discord.com',
                proxy: 'http://user:pass@ip:port', 
                rqdata: 'optional_rqdata_here'      // optional field
            },
            HCaptchaType.BASIC
        );

        console.log(`Created task ID: ${task.id}`);
        console.log('Waiting for solution...');

        // Wait for task completion (uses polling with default 5s interval)
        const result = await api.waitForResult(task.id);
        
        console.log('Captcha solved!');
        console.log(`Captcha token: ${result.token}`);
        console.log(`Expires at: ${result.expires_at}`);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Run the example
solveCaptcha();