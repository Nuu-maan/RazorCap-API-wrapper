package razorcap

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "time"
)

const BaseURL = "https://api.razorcap.xyz"

// HCaptchaType represents the type of hCaptcha task
type HCaptchaType string

const (
    // HCaptchaBasic represents the basic hCaptcha task type
    HCaptchaBasic HCaptchaType = "hcaptcha_basic"
    // HCaptchaEnterprise represents the enterprise hCaptcha task type
    HCaptchaEnterprise HCaptchaType = "hcaptcha_enterprise"
)

// HCaptchaTaskData represents the configuration for an hCaptcha task
type HCaptchaTaskData struct {
    Sitekey string `json:"sitekey"`
    Siteurl string `json:"siteurl"`
    Proxy   string `json:"proxy"`
    Rqdata  string `json:"rqdata,omitempty"`
}

// CreateTaskResponse represents the response from creating a new task
type CreateTaskResponse struct {
    Price   string `json:"price"`
    Status  string `json:"status"`
    TaskID  int    `json:"task_id"`
}

// TaskResult represents the result of a captcha solving task
type TaskResult struct {
    ResponseKey string `json:"response_key,omitempty"`
    Status     string `json:"status"`
    Error      string `json:"error,omitempty"`
}

// Client represents a RazorCap API client
type Client struct {
    APIKey     string
    HTTPClient *http.Client
}

// NewClient creates a new RazorCap API client
func NewClient(apiKey string) *Client {
    return &Client{
        APIKey: apiKey,
        HTTPClient: &http.Client{
            Timeout: time.Second * 30,
        },
    }
}

// CreateTask creates a new hCaptcha solving task
func (c *Client) CreateTask(taskData HCaptchaTaskData, taskType HCaptchaType) (*CreateTaskResponse, error) {
    payload := struct {
        Key  string          `json:"key"`
        Type HCaptchaType    `json:"type"`
        Data HCaptchaTaskData `json:"data"`
    }{
        Key:  c.APIKey,
        Type: taskType,
        Data: taskData,
    }

    payloadBytes, err := json.Marshal(payload)
    if err != nil {
        return nil, fmt.Errorf("error marshaling payload: %w", err)
    }

    req, err := http.NewRequest("POST", fmt.Sprintf("%s/create_task", BaseURL), bytes.NewBuffer(payloadBytes))
    if err != nil {
        return nil, fmt.Errorf("error creating request: %w", err)
    }

    req.Header.Set("Content-Type", "application/json")

    resp, err := c.HTTPClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("error making request: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
    }

    var result CreateTaskResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, fmt.Errorf("error decoding response: %w", err)
    }

    return &result, nil
}

// GetTaskResult gets the result of a specific task
func (c *Client) GetTaskResult(taskID int) (*TaskResult, error) {
    req, err := http.NewRequest("GET", fmt.Sprintf("%s/get_result/%d", BaseURL, taskID), nil)
    if err != nil {
        return nil, fmt.Errorf("error creating request: %w", err)
    }

    resp, err := c.HTTPClient.Do(req)
    if err != nil {
        return nil, fmt.Errorf("error making request: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
    }

    var result TaskResult
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, fmt.Errorf("error decoding response: %w", err)
    }

    return &result, nil
}

// WaitOptions configures the polling behavior for WaitForResult
type WaitOptions struct {
    MaxAttempts int
    Delay       time.Duration
}


// DefaultWaitOptions returns the default polling configuration
func DefaultWaitOptions() WaitOptions {
    return WaitOptions{
        MaxAttempts: 60,
        Delay:       5 * time.Second,
    }
}

// WaitForResult waits for task completion with polling
func (c *Client) WaitForResult(taskID int, opts WaitOptions) (*TaskResult, error) {
    for attempt := 0; attempt < opts.MaxAttempts; attempt++ {
        result, err := c.GetTaskResult(taskID)
        if err != nil {
            return nil, fmt.Errorf("error getting task result: %w", err)
        }

        switch result.Status {
        case "solved":
            return result, nil
        case "error":
            return nil, fmt.Errorf("task failed: %s", result.Error)
        default:
            time.Sleep(opts.Delay)
        }
    }

    return nil, fmt.Errorf("task %d did not complete within %d attempts", taskID, opts.MaxAttempts)
}