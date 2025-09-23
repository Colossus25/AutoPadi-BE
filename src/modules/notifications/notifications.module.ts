import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../auth/entities/user.entity";
import { NotificationJob } from "./entities/notification-jobs.entity";
import { Notification } from "./entities/notification.entity";
import { NotificationsSubscriberService } from "./notifications-subscriber.service";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationJob,
      User,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsSubscriberService],
  exports: [NotificationsService, NotificationsSubscriberService],
})
export class NotificationsModule {}
