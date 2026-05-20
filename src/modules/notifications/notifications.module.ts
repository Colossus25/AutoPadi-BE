import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../auth/entities/user.entity";
import { DeviceToken } from "./entities/device-token.entity";
import { NotificationJob } from "./entities/notification-jobs.entity";
import { Notification } from "./entities/notification.entity";
import { FcmService } from "./fcm.service";
import { NotificationsGateway } from "./notifications.gateway";
import { NotificationsSubscriberService } from "./notifications-subscriber.service";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationJob,
      DeviceToken,
      User,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsSubscriberService,
    FcmService,
    NotificationsGateway,
  ],
  exports: [NotificationsService, NotificationsSubscriberService, FcmService],
})
export class NotificationsModule {}
