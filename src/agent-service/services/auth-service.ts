import type {
  AuthConfig,
  DeviceCodeResponse,
  TokenResponse,
} from "./interfaces";
import fs from "fs/promises";
import { LoggerService } from "./logger-service";

export class AuthService {
  private static instance: AuthService;
  private readonly logger = LoggerService.getInstance();
  private readonly config: AuthConfig;

  private constructor(config?: Partial<AuthConfig>) {
    this.config = {
      clientId: "01ab8ac9400c4e429b23",
      scope: "read:user",
      maxRetries: 30,
      retryInterval: 10,
      ...config,
    };
  }

  public static getInstance(config?: Partial<AuthConfig>): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService(config);
    }
    return AuthService.instance;
  }

  public async getToken(): Promise<string> {
    // Check if token is already in environment variable
    const envToken = process.env.GITHUB_TOKEN;
    if (envToken) {
      this.logger.info("[INFO] Using existing GitHub token from environment");
      return envToken;
    }

    // Device login needs a human; fail fast when run non-interactively (e.g. from the web UI)
    if (!process.stdin.isTTY) {
      throw new Error(
        "No GitHub token found. Set GITHUB_TOKEN (e.g. export it before `docker compose up`) or pass --token.",
      );
    }

    // If no token in env, authenticate and get one
    this.logger.info(
      "[INFO] No GitHub token found, starting authentication...",
    );
    return await this.authenticate();
  }

  private async authenticate(): Promise<string> {
    this.logger.info("[INFO] Starting GitHub OAuth device flow...");

    const deviceCode = await this.requestDeviceCode();
    this.displayUserInstructions(deviceCode);

    const accessToken = await this.pollForAccessToken(deviceCode.device_code);
    await this.saveTokenToEnv(accessToken);

    this.logger.info("[SUCCESS] Authentication successful!");
    return accessToken;
  }

  private async requestDeviceCode(): Promise<DeviceCodeResponse> {
    const response = await fetch("https://github.com/login/device/code", {
      method: "POST",
      body: JSON.stringify({
        client_id: this.config.clientId,
        scope: this.config.scope,
      }),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to request device code: ${response.statusText}`);
    }

    return (await response.json()) as DeviceCodeResponse;
  }

  private displayUserInstructions(deviceCode: DeviceCodeResponse): void {
    this.logger.info(`🔗 Go to: ${deviceCode.verification_uri}`);
    this.logger.info(`📋 Enter code: ${deviceCode.user_code}`);
    this.logger.info("⏳ Waiting for authorization...\n");
  }

  private async pollForAccessToken(deviceCode: string): Promise<string> {
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      await this.sleep(this.config.retryInterval * 1000);

      const tokenResponse = await this.requestAccessToken(deviceCode);

      if (tokenResponse.access_token) {
        return tokenResponse.access_token;
      }

      if (tokenResponse.error !== "authorization_pending") {
        throw new Error(`Auth error: ${tokenResponse.error}`);
      }

      // Show progress indicator
      process.stdout.write(".");
    }

    throw new Error(
      "Authentication timeout - user did not authorize within the time limit",
    );
  }

  private async requestAccessToken(deviceCode: string): Promise<TokenResponse> {
    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        body: JSON.stringify({
          client_id: this.config.clientId,
          device_code: deviceCode,
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        }),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to request access token: ${response.statusText}`);
    }

    return (await response.json()) as TokenResponse;
  }

  private async saveTokenToEnv(accessToken: string): Promise<void> {
    try {
      await fs.writeFile(".env", `GITHUB_TOKEN=${accessToken}\n`);
      this.logger.info("💾 Token saved to .env file");
    } catch (error) {
      this.logger.warn("\n⚠️  Could not save token to .env file:", error);
      this.logger.info(
        "💡 Please manually set GITHUB_TOKEN environment variable",
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
