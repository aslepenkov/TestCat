export interface AuthConfig {
  clientId: string;
  scope: string;
  maxRetries: number;
  retryInterval: number;
}

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  interval: number;
}

export interface TokenResponse {
  access_token?: string;
  error?: string;
}
