import { Controller, Get, Req, Res, UseGuards, HttpStatus } from '@nestjs/common';
import { BannerService } from '@/modules/superadmin/service/banner.service';
import { AuthGuard } from '@/guards';
import { UserRequest } from '@/definitions';
import { Response } from 'express';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { _AUTH_COOKIE_NAME_, DASHBOARD_CATEGORIES } from '@/constants';

@ApiCookieAuth(_AUTH_COOKIE_NAME_)
@UseGuards(AuthGuard)
@ApiTags('Dashboard')
@UseGuards(AuthGuard)
@Controller('dashboard')
export class DashboardController {
    constructor(private readonly bannerService: BannerService) {}

    @Get('banners')
    async getAllBanners(@Req() req: UserRequest, @Res() res: Response) {
        const banners = await this.bannerService.getAllBanners();
        return res.status(HttpStatus.OK).json({
        success: true,
        data: banners,
        });
    }

    @Get('categories')
    async getCategories(@Req() req: UserRequest, @Res() res: Response) {
    return res.status(HttpStatus.OK).json({
        success: true,
        data: DASHBOARD_CATEGORIES,
    });
    }
}
