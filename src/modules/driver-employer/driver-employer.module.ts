import { Module } from '@nestjs/common';
import { DriverJobService } from './service/driver-job.service';
import { DriverJobController } from './controllers/driver-job.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverJob } from './entities/driver-job.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DriverJob])
  ],
  providers: [DriverJobService],
  controllers: [DriverJobController],
  exports: [DriverJobService]
})
export class DriverEmployerModule {}
