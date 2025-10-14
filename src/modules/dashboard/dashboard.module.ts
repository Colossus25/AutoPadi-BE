import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannerService } from '@/modules/superadmin/service/banner.service';
import { Banner } from '@/modules/superadmin/entities/banner.entity';
import { DashboardController } from './controllers/dashboard.controller';
import { StoreService } from '@/modules/autodealer/service/store.service';
import { Store } from '../autodealer/entities/store.entity';
import { DashboardService } from './services/dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Banner, Store]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService, BannerService, StoreService], 
  exports: [DashboardService, BannerService, StoreService],
})
export class DashboardModule {}
