from enum import Enum
import requests
from typing import Dict, Optional, Union
from dataclasses import dataclass

class HCaptchaType(Enum):
    """Available hCaptcha task types"""
    BASIC = "hcaptcha_basic"
    ENTERPRISE = "hcaptcha_enterprise"

@dataclass
class HCaptchaTaskData:
    sitekey: str
    siteurl: str
    proxy: str
    rqdata: Optional[str] = None

class RazorCapAPI:
    """
    Python wrapper for the RazorCap API, providing easy access to hCaptcha solving services.
    """
    
    BASE_URL = "https://api.razorcap.xyz"
    
    def __init__(self, api_key: str):
        """
        Initialize the RazorCap API wrapper.
        
        Args:
            api_key (str): Your RazorCap API key
        """
        self.api_key = api_key
        
    def create_task(self, 
                    task_data: HCaptchaTaskData, 
                    task_type: HCaptchaType = HCaptchaType.BASIC) -> Dict[str, Union[str, int]]:
        """
        Create a new hCaptcha solving task.
        
        Args:
            task_data (HCaptchaTaskData): Task configuration data
            task_type (HCaptchaType): Type of hCaptcha task (BASIC or ENTERPRISE)
            
        Returns:
            dict: Response containing task_id, price, and status
            
        Raises:
            requests.exceptions.RequestException: If the API request fails
        """
        endpoint = f"{self.BASE_URL}/create_task"
        
        payload = {
            'key': self.api_key,
            'type': task_type.value,
            'data': {
                'sitekey': task_data.sitekey,
                'siteurl': task_data.siteurl,
                'proxy': task_data.proxy,
            }
        }
        
        if task_data.rqdata:
            payload['data']['rqdata'] = task_data.rqdata
            
        response = requests.post(endpoint, json=payload)
        response.raise_for_status()
        
        return response.json()
    
    def get_task_result(self, task_id: int) -> Dict[str, str]:
        """
        Get the result of a specific task.
        
        Args:
            task_id (int): ID of the task to check
            
        Returns:
            dict: Response containing status and response_key if solved
            
        Raises:
            requests.exceptions.RequestException: If the API request fails
        """
        endpoint = f"{self.BASE_URL}/get_result/{task_id}"
        
        response = requests.get(endpoint)
        response.raise_for_status()
        
        return response.json()

    async def wait_for_result(self, task_id: int, max_attempts: int = 60, delay: int = 5) -> Dict[str, str]:
        """
        Wait for task completion with polling.
        
        Args:
            task_id (int): ID of the task to check
            max_attempts (int): Maximum number of polling attempts
            delay (int): Delay between attempts in seconds
            
        Returns:
            dict: Final task result
            
        Raises:
            TimeoutError: If max_attempts is reached without a solution
        """
        import asyncio
        
        for _ in range(max_attempts):
            result = self.get_task_result(task_id)
            
            if result['status'] == 'solved':
                return result
            elif result['status'] == 'error':
                raise Exception(f"Task failed: {result.get('error', 'Unknown error')}")
                
            await asyncio.sleep(delay)
            
        raise TimeoutError(f"Task {task_id} did not complete within the allowed time")