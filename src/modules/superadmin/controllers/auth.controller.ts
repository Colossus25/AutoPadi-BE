import { Body, Controller, Post, Req, Res, UsePipes, HttpStatus } from '@nestjs/common';
import { SuperadminService } from '../service/auth.service';
import { SuperLoginDto } from '../dto/login.dto';
import { superLoginValidation } from '../validations/superadmin.validation';
import { JoiValidationPipe } from '@/pipes/joi.validation.pipe';
import { Response, Request } from 'express';
import { CookieOptions, SUPERADMIN_AUTH_COOKIE } from '@/constants';
import { SuperAdminRequest } from '@/definitions';
import { extractSuperAdminFromCookie } from '@/core/utils';

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
      res.status(HttpStatus.NOT_ACCEPTABLE).json({
        success: false,
        message: "Authentication failed, please try again"
      })
    }

    const cookieData = { token, superAdmin: extractSuperAdminFromCookie(req) }
    res.cookie(
        SUPERADMIN_AUTH_COOKIE,
        encodeURIComponent(JSON.stringify(cookieData)),
        CookieOptions
    )

    return {
        data: superAdmin
    }
    
  }
}