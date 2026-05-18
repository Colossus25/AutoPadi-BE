import { Module } from '@nestjs/common';
import { StoreService } from '../autodealer/service/store.service';
import { StoreController } from '../autodealer/controllers/store.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './entities/store.entity';
import { ProductService } from './service/product.service';
import { ProductController } from './controllers/product.controller';
import { Product } from './entities/product.entity';
import { SubscriptionsModule } from '@/modules/subscriptions/subscriptions.module';
import { AnalyticsModule } from '@/modules/analytics/analytics.module';

@Module({
  imports: [
    SubscriptionsModule,
    AnalyticsModule,
    TypeOrmModule.forFeature([
      Store,
      Product,
    ])
  ],
  providers: [StoreService, ProductService],
  controllers: [StoreController, ProductController],
  exports: [StoreService, ProductService]
})
export class AutodealerModule {}
