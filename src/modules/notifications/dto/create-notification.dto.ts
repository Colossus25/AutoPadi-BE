import { ApiProperty } from "@nestjs/swagger";

export class CreateNotificationDto {
  message: string;
  tag: string;
  userId: number;
  metadata?: object;
}

export class CreateNotificationJobDto {
  tag: string;
  userId: number;
  payload: unknown;
  notification_message?: string;
  action_note?: string;
  queue_able?: boolean;
}

export class RegisterDeviceTokenDto {
  @ApiProperty({
    example: "fHk3...:APA91b...",
    required: true,
    description: "The FCM registration token issued on the device.",
  })
  token: string;

  @ApiProperty({
    example: "android",
    enum: ["android", "ios", "web"],
    required: false,
  })
  platform?: "android" | "ios" | "web";
}

export class NotifyDto {
  userId: number;
  tag: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}
