from razorcap import RazorCapAPI, HCaptchaTaskData, HCaptchaType
import asyncio

# Replace with your actual API key
API_KEY = "YOUR_API_KEY_HERE"

# Example task data
task_data = HCaptchaTaskData(
    sitekey="a9b5fb07-92ff-493f-86fe-352a2803b3df",  
    siteurl="discord.com",  
    proxy="http://user:pass@ip:port",  # Replace with your proxy details
    rqdata="optional_rqdata_here"  # Optional
)

# Initialize the API client
api = RazorCapAPI(API_KEY)

# Synchronous example
def solve_captcha_sync():
    try:
        # Create a new hCaptcha task
        task = api.create_task(task_data, HCaptchaType.BASIC)
        print(f"Task created! Task ID: {task['task_id']}")

        # Check the result (polling)
        result = api.check_result(task['task_id'])
        while result['status'] not in ['solved', 'error']:
            print("Waiting for solution...")
            result = api.check_result(task['task_id'])

        if result['status'] == 'solved':
            print(f"Captcha solved! Token: {result['response_key']}")
        else:
            print(f"Error: {result.get('error', 'Unknown error')}")

    except Exception as e:
        print(f"Error: {e}")

# Asynchronous example (recommended)
async def solve_captcha_async():
    try:
        # Create a new hCaptcha task
        task = api.create_task(task_data, HCaptchaType.BASIC)
        print(f"Task created! Task ID: {task['task_id']}")

        # Wait for the result asynchronously
        result = await api.wait_for_result(task['task_id'])
        print(f"Captcha solved! Token: {result['response_key']}")

    except Exception as e:
        print(f"Error: {e}")

