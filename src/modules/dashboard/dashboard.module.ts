import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannerService } from '@/modules/superadmin/service/banner.service';
import { Banner } from '@/modules/superadmin/entities/banner.entity';
import { DashboardController } from './controllers/dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Banner]),
  ],
  controllers: [DashboardController],
  providers: [BannerService], 
  exports: [BannerService],
})
export class DashboardModule {}
