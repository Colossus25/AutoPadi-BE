import { Controller, Get, Req, Res, UseGuards, HttpStatus, Param } from '@nestjs/common';
import { BannerService } from '@/modules/superadmin/service/banner.service';
import { AuthGuard } from '@/guards';
import { UserRequest } from '@/definitions';
import { Response } from 'express';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { _AUTH_COOKIE_NAME_, DASHBOARD_CATEGORIES } from '@/constants';
import { StoreService } from '@/modules/autodealer/service/store.service';
import { DashboardService } from '../services/dashboard.service';

@ApiCookieAuth(_AUTH_COOKIE_NAME_)
@UseGuards(AuthGuard)
@ApiTags('Dashboard')
@UseGuards(AuthGuard)
@Controller('dashboard')
export class DashboardController {
    constructor(
        private readonly dashboardService: DashboardService,
        private readonly bannerService: BannerService,
        private readonly storeService: StoreService,
    ) {}

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

    @Get('stores')
    async getAllStores(@Req() req: UserRequest, @Res() res: Response) {
        const stores = await this.dashboardService.getAllStores();
        return res.status(HttpStatus.OK).json({ success: true, data: stores });
    }

    @Get('store/:id')
    async getStore(@Param('id') id: number, @Req() req: UserRequest, @Res() res: Response) {
        const store = await this.dashboardService.getStoreById(id);
        return res.status(HttpStatus.OK).json({ success: true, data: store });
    }
}
