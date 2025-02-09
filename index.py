from enum import Enum
import requests
from typing import Dict, Optional, Union
from dataclasses import dataclass
import asyncio

class HCaptchaType(Enum):
    """Types of hCaptcha tasks you can solve"""
    BASIC = "hcaptcha_basic"
    ENTERPRISE = "hcaptcha_enterprise"

@dataclass
class HCaptchaTaskData:
    """Container for hCaptcha solving parameters"""
    sitekey: str
    siteurl: str
    proxy: str
    rqdata: Optional[str] = None

class RazorCapAPI:
    """
    Simple hCaptcha solving client for RazorCap API
    
    Usage:
    ------
    # Sync solution (basic)
    api = RazorCapAPI("your_api_key")
    task_data = HCaptchaTaskData(sitekey="...", siteurl="...", proxy="...")
    task = api.create_task(task_data)
    result = api.check_result(task['task_id'])
    
    # Async solution (recommended)
    async def solve_captcha():
        api = RazorCapAPI("your_api_key")
        task = api.create_task(task_data)
        return await api.wait_for_result(task['task_id'])
    
    asyncio.run(solve_captcha())
    """
    
    BASE_URL = "https://api.razorcap.xyz"
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        
    def create_task(self, 
                   task_data: HCaptchaTaskData, 
                   task_type: HCaptchaType = HCaptchaType.BASIC) -> Dict:
        """
        Start a new captcha solving task
        
        Example:
        -------
        task_data = HCaptchaTaskData(
            sitekey="sitekey_value",
            siteurl="https://example.com",
            proxy="http://user:pass@ip:port"
        )
        task = api.create_task(task_data)
        print(f"Created task {task['task_id']}, cost: {task['price']} credits")
        """
        response = requests.post(
            f"{self.BASE_URL}/create_task",
            json={
                'key': self.api_key,
                'type': task_type.value,
                'data': {
                    'sitekey': task_data.sitekey,
                    'siteurl': task_data.siteurl,
                    'proxy': task_data.proxy,
                    'rqdata': task_data.rqdata
                }
            }
        )
        response.raise_for_status()
        return response.json()
    
    def check_result(self, task_id: int) -> Dict:
        """Check if solution is ready (instant response)"""
        response = requests.get(f"{self.BASE_URL}/get_result/{task_id}")
        response.raise_for_status()
        return response.json()

    async def wait_for_result(self, 
                             task_id: int, 
                             max_wait: int = 300, 
                             check_interval: int = 5) -> Dict:
        """
        Wait for captcha solution (non-blocking async)
        
        Example:
        -------
        async def my_app():
            result = await api.wait_for_result(task_id)
            print(f"Captcha token: {result['response_key']}")
        """
        start_time = asyncio.get_event_loop().time()
        while (asyncio.get_event_loop().time() - start_time) < max_wait:
            result = await asyncio.to_thread(self.check_result, task_id)
            
            if result['status'] == 'solved':
                return result
            elif result['status'] == 'error':
                raise Exception(f"Solving failed: {result.get('error', 'Unknown error')}")
            
            await asyncio.sleep(check_interval)
        
        raise TimeoutError(f"No solution after {max_wait} seconds")