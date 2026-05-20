import { UserRequest } from "@/definitions";
import { Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, QueryRunner, Repository } from "typeorm";
import {
  CreateNotificationDto,
  CreateNotificationJobDto,
  NotifyDto,
  RegisterDeviceTokenDto,
} from "./dto/create-notification.dto";
import { User } from "@/modules/auth/entities/user.entity";
import {
  DevicePlatform,
  DeviceToken,
} from "./entities/device-token.entity";
import { NotificationJob } from "./entities/notification-jobs.entity";
import { Notification } from "./entities/notification.entity";
import { FcmService } from "./fcm.service";
import { NotificationsGateway } from "./notifications.gateway";

// FCM allows at most 500 tokens per multicast request.
const FCM_MULTICAST_LIMIT = 500;

@Injectable()
export class NotificationsService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly fcmService: FcmService,
    private readonly gateway: NotificationsGateway,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationJob)
    private readonly notificationJobRepository: Repository<NotificationJob>,
    @InjectRepository(DeviceToken)
    private readonly deviceTokenRepository: Repository<DeviceToken>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
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

  async findAll(userId: number, page = 1, limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);

    const [data, total] = await this.notificationRepository.findAndCount({
      where: { user: { id: userId } },
      order: { created_at: "DESC" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });

    return {
      data,
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async findOne(id: number, req: UserRequest) {
    const { id: userId } = req.user;

    return await this.notificationRepository.findOne({
      where: { id, user: { id: userId } },
    });
  }

  async unreadCount(userId: number) {
    const count = await this.notificationRepository.count({
      where: { user: { id: userId }, read_at: IsNull() },
    });
    return { count };
  }

  /** Marks a single notification as read (no-op if already read). */
  async markRead(id: number, userId: number) {
    await this.notificationRepository.update(
      { id, user: { id: userId }, read_at: IsNull() },
      { read_at: new Date() }
    );
    return { message: "Notification marked as read" };
  }

  async readAll(req: UserRequest) {
    const { user } = req;

    await this.notificationRepository.update(
      { user: { id: user.id }, read_at: IsNull() },
      { read_at: new Date() }
    );
    return { message: "All notifications marked as read" };
  }

  /**
   * Registers (or refreshes) an FCM device token for a user. A token is unique
   * across the system, so if it already exists it is reassigned to this user
   * (handles the case where the same device is shared / re-logged in).
   */
  async registerDeviceToken(userId: number, dto: RegisterDeviceTokenDto) {
    const { token, platform } = dto;

    const existing = await this.deviceTokenRepository.findOne({
      where: { token },
    });

    if (existing) {
      existing.user = { id: userId } as never;
      existing.platform = (platform as DevicePlatform) ?? existing.platform;
      existing.last_used_at = new Date();
      await this.deviceTokenRepository.save(existing);
    } else {
      await this.deviceTokenRepository.save(
        this.deviceTokenRepository.create({
          token,
          platform: (platform as DevicePlatform) ?? DevicePlatform.ANDROID,
          last_used_at: new Date(),
          user: { id: userId } as never,
        })
      );
    }

    return { message: "Device token registered" };
  }

  /** Removes a device token (call on logout). */
  async removeDeviceToken(userId: number, token: string) {
    await this.deviceTokenRepository.delete({ token, user: { id: userId } });
    return { message: "Device token removed" };
  }

  /**
   * Single entry point for notifying a user: persists an in-app notification
   * and pushes via FCM to all of the user's registered devices. Dead tokens
   * reported by FCM are pruned automatically.
   */
  async notify(dto: NotifyDto, queryRunner?: QueryRunner) {
    const { userId, tag, title, body, data } = dto;

    // 1. Persist the in-app notification.
    await this.create(
      { message: body, tag, userId, metadata: { title, ...data } },
      queryRunner
    );

    // 2. Real-time emit to any connected devices.
    this.gateway.emitToUser(userId, "notification", { tag, title, body, data });

    // 3. Push to devices.
    await this.pushToUser(userId, { title, body, data: { tag, ...data } });
  }

  /** Sends an FCM push to every device registered for the user. */
  async pushToUser(
    userId: number,
    message: { title: string; body: string; data?: Record<string, string> }
  ) {
    if (!this.fcmService.isEnabled) return;

    const devices = await this.deviceTokenRepository.find({
      where: { user: { id: userId } },
    });
    const tokens = devices.map((d) => d.token);
    if (tokens.length === 0) return;

    const invalidTokens = await this.fcmService.sendToTokens(tokens, message);

    if (invalidTokens.length > 0) {
      await this.deviceTokenRepository.delete({ token: In(invalidTokens) });
    }
  }

  /**
   * Sends a notification to an explicit list of users (in-app + push to each).
   */
  async notifyUsers(userIds: number[], dto: Omit<NotifyDto, "userId">) {
    if (userIds.length === 0) return { recipients: 0 };

    // Persist one in-app notification per recipient.
    const rows = userIds.map((id) =>
      this.notificationRepository.create({
        message: dto.body,
        tag: dto.tag,
        user: { id } as never,
        metadata: { title: dto.title, ...dto.data },
      })
    );
    await this.notificationRepository.save(rows);

    // Real-time emit to each connected recipient.
    for (const id of userIds) {
      this.gateway.emitToUser(id, "notification", {
        tag: dto.tag,
        title: dto.title,
        body: dto.body,
        data: dto.data,
      });
    }

    // Push to every device owned by these users, chunked to FCM's limit.
    await this.pushToUsers(userIds, {
      title: dto.title,
      body: dto.body,
      data: { tag: dto.tag, ...dto.data },
    });

    return { recipients: userIds.length };
  }

  /**
   * Broadcasts to all users, optionally filtered by user_type
   * (e.g. "driver", "auto dealer", "service provider").
   */
  async broadcast(
    dto: Omit<NotifyDto, "userId"> & { userType?: string }
  ) {
    const { userType, ...payload } = dto;

    const users = await this.userRepository.find({
      select: { id: true },
      where: userType ? { user_type: userType } : {},
    });
    const userIds = users.map((u) => u.id);

    return await this.notifyUsers(userIds, payload);
  }

  /** Pushes to all devices of the given users, chunked to FCM's multicast limit. */
  private async pushToUsers(
    userIds: number[],
    message: { title: string; body: string; data?: Record<string, string> }
  ) {
    if (!this.fcmService.isEnabled || userIds.length === 0) return;

    const devices = await this.deviceTokenRepository.find({
      where: { user: { id: In(userIds) } },
    });
    const tokens = devices.map((d) => d.token);
    if (tokens.length === 0) return;

    const invalidTokens: string[] = [];
    for (let i = 0; i < tokens.length; i += FCM_MULTICAST_LIMIT) {
      const chunk = tokens.slice(i, i + FCM_MULTICAST_LIMIT);
      const dead = await this.fcmService.sendToTokens(chunk, message);
      invalidTokens.push(...dead);
    }

    if (invalidTokens.length > 0) {
      await this.deviceTokenRepository.delete({ token: In(invalidTokens) });
    }
  }
}
