import { UserRequest } from "@/definitions";
import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, QueryRunner, Repository } from "typeorm";
import {
  CreateNotificationDto,
  CreateNotificationJobDto,
} from "./dto/create-notification.dto";
import { NotificationJob } from "./entities/notification-jobs.entity";
import { Notification } from "./entities/notification.entity";

@Injectable()
export class NotificationsService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationJob)
    private readonly notificationJobRepository: Repository<NotificationJob>
  ) {}

  async createJob(
    createNotificationJobDto: CreateNotificationJobDto,
    queryRunner?: QueryRunner
  ) {
    const {
      payload,
      userId,
      tag,
      action_note,
      notification_message,
      queue_able = true,
    } = createNotificationJobDto;

    const temp: unknown[] = [];
    temp.push(payload);

    if (queryRunner) {
      await queryRunner.manager.save(NotificationJob, {
        tag,
        payload: temp,
        user: { id: userId },
        action_note,
        queue_able,
      });
    } else {
      const notification = this.notificationJobRepository.create({
        tag,
        payload: temp,
        user: { id: userId },
        action_note,
        queue_able,
      });
      await this.notificationJobRepository.save(notification);
    }

    if (notification_message)
      this.create(
        {
          message: notification_message,
          tag,
          userId,
          metadata: payload as never,
        },
        queryRunner
      );
  }

  async create(
    createNotificationDto: CreateNotificationDto,
    queryRunner?: QueryRunner
  ) {
    const { metadata } = createNotificationDto;

    if (queryRunner) {
      queryRunner.manager.save(Notification, {
        ...createNotificationDto,
        user: { id: createNotificationDto.userId },
        metadata: metadata ? metadata : {},
      });
    } else {
      const notification = this.notificationRepository.create({
        ...createNotificationDto,
        user: { id: createNotificationDto.userId },
        metadata: metadata ? metadata : {},
      });

      await this.notificationRepository.save(notification);
    }
  }

  async findAll(userId: number) {
    return await this.notificationRepository.find({
      where: { user: { id: userId } },
      order: { created_at: "DESC" },
    });
  }

  async findOne(id: number, req: UserRequest) {
    const { id: userId } = req.user;

    return await this.notificationRepository.findOne({
      where: { id, user: { id: userId } },
    });
  }

  async readAll(req: UserRequest) {
    const { user } = req;

    await this.notificationRepository.softDelete({
      user: { id: user.id },
      deleted_at: IsNull(),
    });
    return { message: "All notifications cleared" };
  }
}
