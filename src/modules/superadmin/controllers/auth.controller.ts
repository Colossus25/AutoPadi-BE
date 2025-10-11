import { Body, Controller, Post, Req, Res, UsePipes, HttpStatus, Get, UseGuards } from '@nestjs/common';
import { SuperadminService } from '../service/auth.service';
import { CreateAdminDto } from '../dto/create.dto';
import { SuperLoginDto } from '../dto/login.dto';
import { createAdminValidation, superLoginValidation } from '../validations/superadmin.validation';
import { JoiValidationPipe } from '@/pipes/joi.validation.pipe';
import { Response, Request } from 'express';
import { CookieOptions, SUPERADMIN_AUTH_COOKIE } from '@/constants';
import { SuperAdminRequest } from '@/definitions';
import { extractSuperAdminFromCookie } from '@/core/utils';
import { SuperAuthGuard } from '@/guards/super-permissions.guard';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';

@ApiTags("Super Admin")
@Controller('superadmin')
export class SuperadminController {
  constructor(private readonly superadminService: SuperadminService) {}

  @Post('login')
  @UsePipes(new JoiValidationPipe(superLoginValidation))
  async login(
    @Body() superLoginDto: SuperLoginDto,
    @Req() req: SuperAdminRequest,
    @Res() res: Response
  ) {
    res.clearCookie(SUPERADMIN_AUTH_COOKIE);

    const { superAdmin, token } = await this.superadminService.login(superLoginDto, req);
    if (!token || !superAdmin) {
      return res.status(HttpStatus.NOT_ACCEPTABLE).json({
        success: false,
        message: 'Authentication failed, please try again',
      });
    }

    const { password, ...safeSuperAdmin } = superAdmin;

    const cookieData = { token, superadmin: safeSuperAdmin };

    console.log(cookieData)

    res.cookie(
      SUPERADMIN_AUTH_COOKIE,
      encodeURIComponent(JSON.stringify(cookieData)),
      CookieOptions
    );

    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Login successful',
      data: {
        user: safeSuperAdmin,
        token,
      }
    });
  }

  @Post('create-account')
  @UsePipes(new JoiValidationPipe(createAdminValidation))
  async createAdmin(@Body() createAdminDto: CreateAdminDto, @Res() res: Response) {
      const newAdmin = await this.superadminService.createAdmin(createAdminDto);

      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Admin created successfully',
        data: newAdmin,
      });
  }

  @ApiCookieAuth(SUPERADMIN_AUTH_COOKIE)
  @UseGuards(SuperAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: SuperAdminRequest, @Res() res: Response) {
    const { password, ...safeSuperAdmin } = req.user;

    return res.status(HttpStatus.OK).json({
      success: true,
      data: safeSuperAdmin,
    });
  }
}