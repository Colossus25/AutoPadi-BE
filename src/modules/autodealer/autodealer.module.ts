import { Module } from '@nestjs/common';
import { StoreService } from '../autodealer/service/store.service';
import { StoreController } from '../autodealer/controllers/store.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './entities/store.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      Store,
    ])
  ],
  providers: [StoreService],
  controllers: [StoreController],
  exports: [StoreService]
})
export class AutodealerModule {}
