import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannerService } from '@/modules/superadmin/service/banner.service';
import { Banner } from '@/modules/superadmin/entities/banner.entity';
import { DashboardController } from './controllers/dashboard.controller';
import { StoreService } from '@/modules/autodealer/service/store.service';
import { Store } from '../autodealer/entities/store.entity';
import { DashboardService } from './services/dashboard.service';
import { ProductService } from '../autodealer/service/product.service';
import { Product } from '@/modules/autodealer/entities/product.entity';
import { Service } from '@/modules/serviceprovider/entities/service.entity';
import { ProductAttribute } from '@/modules/superadmin/entities/product-attribute.entity';
import { ServiceAttribute } from '@/modules/superadmin/entities/service-attribute.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Banner, Store, Product, Service, ProductAttribute, ServiceAttribute]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService, BannerService, StoreService, ProductService], 
  exports: [DashboardService, BannerService, StoreService, ProductService],
})
export class DashboardModule {}
