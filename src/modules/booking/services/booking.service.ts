import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { BookingReview } from '../entities/booking-review.entity';
import { BookingReport } from '../entities/booking-report.entity';
import { Service } from '@/modules/serviceprovider/entities/service.entity';
import { User } from '@/modules/auth/entities/user.entity';
import { CreateBookingDto, UpdateBookingStatusDto, CreateReviewDto, CreateReportDto } from '../dto/booking.dto';
import { PaginationDto } from '@/modules/global/common/dto/pagination.dto';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(BookingReview)
    private readonly reviewRepository: Repository<BookingReview>,
    @InjectRepository(BookingReport)
    private readonly reportRepository: Repository<BookingReport>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async createBooking(dto: CreateBookingDto, user: User) {
    const service = await this.serviceRepository.findOne({ where: { id: dto.service_id } });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const booking = this.bookingRepository.create({
      service,
      user,
      service_provider: service.created_by,
      status: 'pending',
      booking_date: dto.booking_date,
      preferred_time: dto.preferred_time,
      location: dto.location,
      description: dto.description,
      estimated_cost: dto.estimated_cost,
    });

    return await this.bookingRepository.save(booking);
  }

  async getUserBookings(user: User, pagination: PaginationDto, status?: string) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    let query = this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.user_id = :userId', { userId: user.id })
      .orderBy('booking.created_at', 'DESC');

    if (status) {
      query = query.andWhere('booking.status = :status', { status });
    }

    const [bookings, total] = await query.skip(skip).take(limit).getManyAndCount();

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      bookings,
    };
  }

  async getServiceProviderBookings(user: User, pagination: PaginationDto, status?: string) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    let query = this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.service_provider_id = :providerId', { providerId: user.id })
      .orderBy('booking.created_at', 'DESC');

    if (status) {
      query = query.andWhere('booking.status = :status', { status });
    }

    const [bookings, total] = await query.skip(skip).take(limit).getManyAndCount();

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      bookings,
    };
  }

  async getBookingById(id: number) {
    const booking = await this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.service_provider', 'service_provider')
      .leftJoinAndSelect('booking.reviews', 'reviews')
      .leftJoinAndSelect('booking.reports', 'reports')
      .where('booking.id = :id', { id })
      .getOne();

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async updateBookingStatus(id: number, dto: UpdateBookingStatusDto, user: User) {
    const booking = await this.getBookingById(id);

    if (booking.service_provider.id !== user.id) {
      throw new ForbiddenException('Only the service provider can update booking status');
    }

    if (booking.status !== 'pending') {
      throw new BadRequestException('Booking can only be updated from pending status');
    }

    booking.status = dto.status;
    if (dto.final_cost) booking.final_cost = dto.final_cost;
    if (dto.declined_reason) booking.declined_reason = dto.declined_reason;
    if (dto.cancelled_reason) booking.cancelled_reason = dto.cancelled_reason;

    return await this.bookingRepository.save(booking);
  }

  async cancelBooking(id: number, user: User, reason?: string) {
    const booking = await this.getBookingById(id);

    if (booking.user.id !== user.id) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      throw new BadRequestException(`Cannot cancel a ${booking.status} booking`);
    }

    booking.status = 'cancelled';
    if (reason) {
      booking.cancelled_reason = reason;
    }

    return await this.bookingRepository.save(booking);
  }

  async addReview(bookingId: number, dto: CreateReviewDto, user: User) {
    const booking = await this.getBookingById(bookingId);

    if (booking.user.id !== user.id) {
      throw new ForbiddenException('Only the user who booked can leave a review');
    }

    if (booking.status !== 'completed') {
      throw new BadRequestException('Can only review completed bookings');
    }

    const existingReview = await this.reviewRepository.findOne({
      where: { booking: { id: bookingId }, reviewer: { id: user.id } },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this booking');
    }

    const review = this.reviewRepository.create({
      booking,
      reviewer: user,
      rating: dto.rating,
      comment: dto.comment,
    });

    return await this.reviewRepository.save(review);
  }

  async addReport(bookingId: number, dto: CreateReportDto, user: User) {
    const booking = await this.getBookingById(bookingId);

    if (booking.user.id !== user.id && booking.service_provider.id !== user.id) {
      throw new ForbiddenException('You are not involved in this booking');
    }

    const report = this.reportRepository.create({
      booking,
      reporter: user,
      reason: dto.reason,
      description: dto.description,
    });

    return await this.reportRepository.save(report);
  }
}
