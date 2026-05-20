import { _AUTH_COOKIE_NAME_ } from '@/constants';
import { UserRequest } from '@/definitions';
import { AuthGuard } from '@/guards';
import { JoiValidationPipe } from '@/pipes/joi.validation.pipe';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RegisterDeviceTokenDto } from './dto/create-notification.dto';
import { NotificationsService } from './notifications.service';
import { registerDeviceTokenValidation } from './validations/device-token.validation';

@ApiCookieAuth(_AUTH_COOKIE_NAME_)
@ApiTags('Notifications')
@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Req() req: UserRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return await this.notificationsService.findAll(
      req.user.id,
      page ? +page : undefined,
      limit ? +limit : undefined,
    );
  }

  @Get('unread-count')
  async unreadCount(@Req() req: UserRequest) {
    return await this.notificationsService.unreadCount(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: UserRequest) {
    return await this.notificationsService.findOne(+id, req);
  }

  @Post(':id/read')
  async markRead(@Param('id') id: string, @Req() req: UserRequest) {
    return await this.notificationsService.markRead(+id, req.user.id);
  }

  @Post('read-all')
  async readOneAll(@Req() req: UserRequest) {
    return await this.notificationsService.readAll(req);
  }

  @Post('device-token')
  async registerDeviceToken(
    @Req() req: UserRequest,
    @Body(new JoiValidationPipe(registerDeviceTokenValidation))
    body: RegisterDeviceTokenDto,
  ) {
    return await this.notificationsService.registerDeviceToken(
      req.user.id,
      body,
    );
  }

  @Delete('device-token/:token')
  async removeDeviceToken(
    @Req() req: UserRequest,
    @Param('token') token: string,
  ) {
    return await this.notificationsService.removeDeviceToken(
      req.user.id,
      token,
    );
  }
}
