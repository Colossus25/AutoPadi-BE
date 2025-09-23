import { NotificationJob } from "@/modules/notifications/entities/notification-jobs.entity";
import { Notification } from "@/modules/notifications/entities/notification.entity";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CronJob } from "./cron.job";
import { CronService } from "./cron.service";

@Module({
  imports: [TypeOrmModule.forFeature([Notification, NotificationJob])],
  providers: [CronService, CronJob],
})
export class CronModule {}
