import { Controller, Get, Req, Res, UseGuards, HttpStatus, Param, Query } from '@nestjs/common';
import { BannerService } from '@/modules/superadmin/service/banner.service';
import { AuthGuard } from '@/guards';
import { UserRequest } from '@/definitions';
import { Response } from 'express';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { _AUTH_COOKIE_NAME_, DASHBOARD_CATEGORIES } from '@/constants';
import { DashboardService } from '../services/dashboard.service';
import { SearchDto } from '../dto/search.dto';

@ApiCookieAuth(_AUTH_COOKIE_NAME_)
@UseGuards(AuthGuard)
@ApiTags('Dashboard')
@UseGuards(AuthGuard)
@Controller('dashboard')
export class DashboardController {
    constructor(
        private readonly dashboardService: DashboardService,
        private readonly bannerService: BannerService,
    ) {}

    @Get('search')
    async search(@Query() filters: SearchDto, @Res() res: Response) {
        const data = await this.dashboardService.search(filters);
        return res.status(HttpStatus.OK).json({ success: true, data });
    }

    @Get('banners')
    async getAllBanners(@Res() res: Response) {
        const banners = await this.bannerService.getAllBanners();
        return res.status(HttpStatus.OK).json({
            success: true,
            data: banners,
        });
    }

    @Get('categories')
    async getCategories(@Res() res: Response) {
        return res.status(HttpStatus.OK).json({
            success: true,
            data: DASHBOARD_CATEGORIES,
        });
    }

    @Get('category/:id')
    async getCategory(@Param('id') categoryId: number, @Res() res: Response,
    ) {
        const data = await this.dashboardService.getCategory(categoryId);
        return res.status(HttpStatus.OK).json({ success: true, data });
    }

    @Get('stores')
    async getAllStores(@Res() res: Response) {
        const stores = await this.dashboardService.getAllStores();
        return res.status(HttpStatus.OK).json({ success: true, data: stores });
    }

    @Get('store/:id')
    async getStore(@Param('id') id: number, @Res() res: Response) {
        const store = await this.dashboardService.getStoreById(id);
        return res.status(HttpStatus.OK).json({ success: true, data: store });
    }

    @Get('products')
    async getAllProducts(@Res() res: Response) {
        const products = await this.dashboardService.getAllProducts();
        return res.status(HttpStatus.OK).json({ success: true, data: products });
    }

    @Get('product/:id')
    async getProduct(@Param('id') id: number, @Res() res: Response) {
        const product = await this.dashboardService.getProductById(id);
        return res.status(HttpStatus.OK).json({ success: true, data: product });
    }

    @Get('states')
    async getStates(@Res() res: Response) {
        const states = this.dashboardService.getAllStates();
        return res.status(HttpStatus.OK).json({ success: true, data: states });
    }

    @Get('state/:id/cities')
    async getCities(@Param('id') stateId: number, @Res() res: Response) {
        try {
        const cities = this.dashboardService.getCitiesByStateId(stateId);
        return res.status(HttpStatus.OK).json({ success: true, data: cities });
        } catch (err) {
        return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: err.message });
        }
    }
}
