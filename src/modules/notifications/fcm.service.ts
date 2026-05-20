import { appConfig } from "@/config";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as admin from "firebase-admin";

export interface FcmMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private app: admin.app.App | null = null;

  onModuleInit() {
    this.init();
  }

  private init() {
    if (this.app) return;

    const raw = appConfig.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
      this.logger.warn(
        "FIREBASE_SERVICE_ACCOUNT not set — push notifications are disabled."
      );
      return;
    }

    try {
      // Accept either base64-encoded JSON or raw JSON.
      const decoded = raw.trim().startsWith("{")
        ? raw
        : Buffer.from(raw, "base64").toString("utf8");
      const serviceAccount = JSON.parse(decoded) as admin.ServiceAccount;

      this.app =
        admin.apps.length > 0 && admin.apps[0]
          ? admin.apps[0]
          : admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
            });
      this.logger.log("Firebase Admin initialized for FCM.");
    } catch (err) {
      this.logger.error(
        `Failed to initialize Firebase Admin: ${(err as Error).message}`
      );
    }
  }

  get isEnabled(): boolean {
    return this.app !== null;
  }

  /**
   * Sends a push to the given tokens.
   * Returns the list of tokens FCM reported as invalid/unregistered so the
   * caller can prune them from the database.
   */
  async sendToTokens(tokens: string[], message: FcmMessage): Promise<string[]> {
    if (!this.isEnabled || tokens.length === 0) return [];

    const invalidTokens: string[] = [];

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title: message.title, body: message.body },
        data: message.data ?? {},
        android: { priority: "high" },
        apns: {
          payload: { aps: { sound: "default", contentAvailable: true } },
        },
      });

      response.responses.forEach((res, idx) => {
        if (res.success) return;
        const code = res.error?.code;
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token" ||
          code === "messaging/invalid-argument"
        ) {
          invalidTokens.push(tokens[idx]);
        } else {
          this.logger.warn(
            `FCM send error for token #${idx}: ${code ?? res.error?.message}`
          );
        }
      });
    } catch (err) {
      this.logger.error(`FCM multicast failed: ${(err as Error).message}`);
    }

    return invalidTokens;
  }
}
