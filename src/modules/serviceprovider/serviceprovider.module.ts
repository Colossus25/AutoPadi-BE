import { Module } from '@nestjs/common';
import { ServiceService } from './service/service.service';
import { ServiceController } from './controllers/service.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service])
  ],
  providers: [ServiceService],
  controllers: [ServiceController],
  exports: [ServiceService]
})
export class ServiceProviderModule {}
