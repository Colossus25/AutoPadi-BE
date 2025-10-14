import { Module } from '@nestjs/common';
import { StoreService } from '../autodealer/service/store.service';
import { StoreController } from '../autodealer/controllers/store.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './entities/store.entity';
import { ProductService } from './service/product.service';
import { ProductController } from './controllers/product.controller';
import { Product } from './entities/product.entity';

@Module({
  imports: [
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
