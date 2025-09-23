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
