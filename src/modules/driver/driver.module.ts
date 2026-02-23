import { Module } from '@nestjs/common';
import { DriverProfileService } from './service/driver-profile.service';
import { DriverProfileController } from './controllers/driver-profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverProfile } from './entities/driver-profile.entity';
import { DriverJob } from '@/modules/driver-employer/entities/driver-job.entity';
import { SubscriptionsModule } from '@/modules/subscriptions/subscriptions.module';
import { DriverEmployerModule } from '@/modules/driver-employer/driver-employer.module';

@Module({
  imports: [
    SubscriptionsModule,
    DriverEmployerModule,
    TypeOrmModule.forFeature([DriverProfile, DriverJob])
  ],
  providers: [DriverProfileService],
  controllers: [DriverProfileController],
  exports: [DriverProfileService]
})
export class DriverModule {}
