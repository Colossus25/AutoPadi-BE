import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { BookingReview } from './entities/booking-review.entity';
import { BookingReport } from './entities/booking-report.entity';
import { Service } from '@/modules/serviceprovider/entities/service.entity';
import { BookingService } from './services/booking.service';
import { UserBookingController } from './controllers/user-booking.controller';
import { ProviderBookingController } from './controllers/provider-booking.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, BookingReview, BookingReport, Service])
  ],
  providers: [BookingService],
  controllers: [UserBookingController, ProviderBookingController],
  exports: [BookingService]
})
export class BookingModule {}
