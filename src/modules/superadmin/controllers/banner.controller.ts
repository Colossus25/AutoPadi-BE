// src/modules/superadmin/controllers/banner.controller.ts
import { Body, Controller, Post, Get, Param, Patch, Delete, UseGuards, UsePipes, Req, Res, HttpStatus } from '@nestjs/common';
import { BannerService } from '../service/banner.service';
import { CreateBannerDto } from '../dto/create-banner.dto';
import { JoiValidationPipe } from '@/pipes/joi.validation.pipe';
import { SuperAuthGuard } from '@/guards/super-permissions.guard';
import { SuperAdminRequest } from '@/definitions';
import { Response } from 'express';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { createBannerValidation } from '../validations/banner.validation';
import { SUPERADMIN_AUTH_COOKIE } from '@/constants';

@ApiCookieAuth(SUPERADMIN_AUTH_COOKIE)
@UseGuards(SuperAuthGuard)
@ApiTags('Super Admin - Banners')
@Controller('superadmin/banner')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

    @Post()
    @UsePipes(new JoiValidationPipe(createBannerValidation))
    async createBanner(@Body() dto: CreateBannerDto, @Req() req: SuperAdminRequest, @Res() res: Response) {
        const banner = await this.bannerService.createBanner(dto, req.user);
        return res.status(HttpStatus.CREATED).json({ success: true, data: banner });
    }

    @Get()
    async getAllBanners(@Res() res: Response) {
        const banners = await this.bannerService.getAllBanners();
        return res.status(HttpStatus.OK).json({ success: true, data: banners });
    }

    @Get(':id')
    async getBanner(@Param('id') id: number, @Res() res: Response) {
        const banner = await this.bannerService.getBannerById(id);
        return res.status(HttpStatus.OK).json({ success: true, data: banner });
    }

    @Patch(':id')
    @UsePipes(new JoiValidationPipe(createBannerValidation))
    async updateBanner(@Param('id') id: number, @Body() dto: CreateBannerDto, 
    @Req() req: SuperAdminRequest,
    @Res() res: Response
    ) {
        const updatedBanner = await this.bannerService.updateBanner(id, dto, req.user);
        return res.status(HttpStatus.OK).json({
            success: true,
            data: updatedBanner,
        });
    }

    @Delete(':id')
    async deleteBanner(@Param('id') id: number, @Res() res: Response) {
        const result = await this.bannerService.deleteBanner(id);
        return res.status(HttpStatus.OK).json({ success: true, ...result });
    }
}
