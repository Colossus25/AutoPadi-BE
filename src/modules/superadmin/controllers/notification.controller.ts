import { SUPERADMIN_AUTH_COOKIE } from '@/constants';
import { SuperAuthGuard } from '@/guards/super-permissions.guard';
import { JoiValidationPipe } from '@/pipes/joi.validation.pipe';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import { Body, Controller, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import {
  BroadcastNotificationDto,
  SendNotificationDto,
} from '../dto/send-notification.dto';
import {
  broadcastNotificationValidation,
  sendNotificationValidation,
} from '../validations/notification.validation';

@ApiCookieAuth(SUPERADMIN_AUTH_COOKIE)
@UseGuards(SuperAuthGuard)
@ApiTags('Super Admin - Notifications')
@Controller('superadmin/notifications')
export class SuperadminNotificationController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Push (+ in-app) to an explicit list of users.
  @Post('send')
  async send(
    @Body(new JoiValidationPipe(sendNotificationValidation))
    dto: SendNotificationDto,
    @Res() res: Response,
  ) {
    const result = await this.notificationsService.notifyUsers(dto.userIds, {
      tag: dto.tag,
      title: dto.title,
      body: dto.body,
      data: dto.data,
    });
    return res.status(HttpStatus.OK).json({ success: true, data: result });
  }

  // Push (+ in-app) to all users, optionally filtered by user_type.
  @Post('broadcast')
  async broadcast(
    @Body(new JoiValidationPipe(broadcastNotificationValidation))
    dto: BroadcastNotificationDto,
    @Res() res: Response,
  ) {
    const result = await this.notificationsService.broadcast({
      userType: dto.userType,
      tag: dto.tag,
      title: dto.title,
      body: dto.body,
      data: dto.data,
    });
    return res.status(HttpStatus.OK).json({ success: true, data: result });
  }
}
