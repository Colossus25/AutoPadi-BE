import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { NotificationEvent } from '@/modules/notifications/notification-events';
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
    private readonly eventEmitter: EventEmitter2,
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

    const saved = await this.bookingRepository.save(booking);

    this.eventEmitter.emit(NotificationEvent.BOOKING_CREATED, {
      providerId: service.created_by.id,
      bookingId: saved.id,
      serviceName: service.name,
    });

    return saved;
  }

  async getUserBookings(user: User, pagination: PaginationDto, status?: string) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    let query = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.service_provider', 'service_provider')
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
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.user', 'buyer')
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
      .leftJoinAndSelect('reviews.reviewer', 'reviewer')
      .leftJoinAndSelect('booking.reports', 'reports')
      .where('booking.id = :id', { id })
      .getOne();

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // A booking only stores its own estimated_cost when the buyer supplied one.
    // When it didn't, fall back to the service's price so the client always has
    // a figure to display. (`??` keeps a real 0 from being overwritten.)
    return {
      ...booking,
      estimated_cost: booking.estimated_cost ?? booking.service?.estimated_cost ?? null,
    };
  }

  async updateBookingStatus(id: number, dto: UpdateBookingStatusDto, user: User) {
    const booking = await this.getBookingById(id);

    if (booking.service_provider.id !== user.id) {
      throw new ForbiddenException('Only the service provider can update booking status');
    }

    const allowedTransitions: Record<string, string[]> = {
      pending: ['scheduled', 'cancelled'],
      scheduled: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!allowedTransitions[booking.status]?.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot change booking status from '${booking.status}' to '${dto.status}'`,
      );
    }

    booking.status = dto.status;
    if (dto.final_cost) booking.final_cost = dto.final_cost;
    if (dto.declined_reason) booking.declined_reason = dto.declined_reason;
    if (dto.cancelled_reason) booking.cancelled_reason = dto.cancelled_reason;

    const saved = await this.bookingRepository.save(booking);

    this.eventEmitter.emit(NotificationEvent.BOOKING_STATUS_CHANGED, {
      customerId: booking.user.id,
      bookingId: booking.id,
      status: booking.status,
      serviceName: booking.service?.name,
      reason: dto.declined_reason || dto.cancelled_reason,
    });

    return saved;
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

    const saved = await this.bookingRepository.save(booking);

    this.eventEmitter.emit(NotificationEvent.BOOKING_CANCELLED, {
      providerId: booking.service_provider.id,
      bookingId: booking.id,
      serviceName: booking.service?.name,
      reason,
    });

    return saved;
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

    const saved = await this.reviewRepository.save(review);

    this.eventEmitter.emit(NotificationEvent.BOOKING_REVIEWED, {
      providerId: booking.service_provider.id,
      bookingId: booking.id,
      rating: dto.rating,
    });

    return saved;
  }

  async getProviderReviews(providerId: number, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const query = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.reviewer', 'reviewer')
      .leftJoin('review.booking', 'booking')
      .leftJoinAndSelect('booking.service', 'service')
      .where('booking.service_provider_id = :providerId', { providerId })
      .orderBy('review.created_at', 'DESC');

    const [reviews, total] = await query.skip(skip).take(limit).getManyAndCount();

    const { avg } = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoin('review.booking', 'booking')
      .where('booking.service_provider_id = :providerId', { providerId })
      .select('AVG(review.rating)', 'avg')
      .getRawOne();

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        averageRating: avg ? Number(Number(avg).toFixed(2)) : 0,
      },
      reviews,
    };
  }

  async getServiceReviews(serviceId: number, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const query = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.reviewer', 'reviewer')
      .leftJoin('review.booking', 'booking')
      .where('booking.service_id = :serviceId', { serviceId })
      .orderBy('review.created_at', 'DESC');

    const [reviews, total] = await query.skip(skip).take(limit).getManyAndCount();

    const { avg } = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoin('review.booking', 'booking')
      .where('booking.service_id = :serviceId', { serviceId })
      .select('AVG(review.rating)', 'avg')
      .getRawOne();

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        averageRating: avg ? Number(Number(avg).toFixed(2)) : 0,
      },
      reviews,
    };
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
