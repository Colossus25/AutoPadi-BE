import { Module } from '@nestjs/common';
import { DriverJobService } from './service/driver-job.service';
import { DriverJobController } from './controllers/driver-job.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverJob } from './entities/driver-job.entity';
import { DriverProfile } from '@/modules/driver/entities/driver-profile.entity';
import { SubscriptionsModule } from '@/modules/subscriptions/subscriptions.module';

@Module({
  imports: [
    SubscriptionsModule,
    TypeOrmModule.forFeature([DriverJob, DriverProfile])
  ],
  providers: [DriverJobService],
  controllers: [DriverJobController],
  exports: [DriverJobService, TypeOrmModule]
})
export class DriverEmployerModule {}
