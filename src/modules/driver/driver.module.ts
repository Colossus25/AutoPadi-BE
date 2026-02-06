import { Module } from '@nestjs/common';
import { DriverProfileService } from './service/driver-profile.service';
import { DriverProfileController } from './controllers/driver-profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverProfile } from './entities/driver-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DriverProfile])
  ],
  providers: [DriverProfileService],
  controllers: [DriverProfileController],
  exports: [DriverProfileService]
})
export class DriverModule {}
