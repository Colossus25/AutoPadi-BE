// src/modules/superadmin/service/banner.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from '../entities/banner.entity';
import { CreateBannerDto } from '../dto/create-banner.dto';
import { SuperAdmin } from '../entities/super-admin.entity';

@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(Banner)
    private readonly bannerRepository: Repository<Banner>,
  ) {}

    async createBanner(dto: CreateBannerDto, superadmin: SuperAdmin) {
    const banner = this.bannerRepository.create({
        ...dto,
        created_by: superadmin,
    });
    return await this.bannerRepository.save(banner);
    }

    async getAllBanners() {
        return await this.bannerRepository.find({ order: { created_at: 'DESC' } });
    }

    async getBannerById(id: number) {
        const banner = await this.bannerRepository.findOne({ where: { id } });
        if (!banner) throw new NotFoundException('Banner not found');
        return banner;
    }

    async updateBanner(id: number, dto: CreateBannerDto, superadmin: SuperAdmin) {
    const banner = await this.getBannerById(id);
    Object.assign(banner, {
        ...dto,
        updated_by: superadmin,
    });
    return await this.bannerRepository.save(banner);
    }

    async deleteBanner(id: number) {
        const banner = await this.getBannerById(id);
        await this.bannerRepository.remove(banner);
        return { message: 'Banner deleted successfully' };
    }
}
