import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { NotificationEvent } from '@/modules/notifications/notification-events';
import { Service, ServiceStatus } from '../entities/service.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { User } from '@/modules/auth/entities/user.entity';
import { PaginationDto } from '@/modules/global/common/dto/pagination.dto';
import { AnalyticsService } from '@/modules/analytics/services/analytics.service';
import {
  AnalyticsEventType,
  AnalyticsResourceType,
} from '@/modules/analytics/entities/analytics-event.entity';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly analyticsService: AnalyticsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createService(dto: CreateServiceDto, user: User, userSubscription?: any) {
    if (user.user_type !== 'service provider') {
      throw new ForbiddenException('Only service providers can create a service');
    }
    const service = this.serviceRepository.create({
      ...dto,
      created_by: user,
      user_subscription: userSubscription || null,
    });
    return await this.serviceRepository.save(service);
  }

  async getAllServices(user: User, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    if (user.user_type !== 'service provider') {
      throw new ForbiddenException('Only service providers can view services');
    }

    const [services, total] = await this.serviceRepository.findAndCount({
      where: { created_by: { id: user.id } },
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      services,
    };
  }

  async getServiceById(id: number, user: User) {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');
    if (service.created_by.id !== user.id) {
      throw new ForbiddenException('You can only view your own services');
    }
    return {
      ...service,
      total_views: service.views_count,
      total_clicks: service.clicks_count,
      total_enquiries: service.enquiries_count,
    };
  }

  async trackView(id: number, user: User) {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');
    await this.serviceRepository.increment({ id }, 'views_count', 1);
    await this.analyticsService.logEvent({
      resource_type: AnalyticsResourceType.SERVICE,
      resource_id: id,
      event_type: AnalyticsEventType.VIEW,
      user_id: user.id,
    });
    return { id, views_count: service.views_count + 1 };
  }

  async trackClick(id: number, user: User) {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');
    await this.serviceRepository.increment({ id }, 'clicks_count', 1);
    await this.analyticsService.logEvent({
      resource_type: AnalyticsResourceType.SERVICE,
      resource_id: id,
      event_type: AnalyticsEventType.CLICK,
      user_id: user.id,
    });
    return { id, clicks_count: service.clicks_count + 1 };
  }

  async trackEnquiry(id: number, user: User) {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');
    await this.serviceRepository.increment({ id }, 'enquiries_count', 1);
    await this.analyticsService.logEvent({
      resource_type: AnalyticsResourceType.SERVICE,
      resource_id: id,
      event_type: AnalyticsEventType.ENQUIRY,
      user_id: user.id,
    });
    return { id, enquiries_count: service.enquiries_count + 1 };
  }

  async getAnalytics(user: User) {
    const services = await this.serviceRepository.find({
      where: { created_by: { id: user.id } },
      select: ['id'],
    });
    const ids = services.map((s) => s.id);
    return this.analyticsService.getMonthlyStats(AnalyticsResourceType.SERVICE, ids);
  }

  async updateService(id: number, dto: CreateServiceDto, user: User) {
    const service = await this.getServiceById(id, user);
    Object.assign(service, {
      ...dto,
      updated_by: user,
    });
    return await this.serviceRepository.save(service);
  }

  async deleteService(id: number, user: User) {
    const service = await this.getServiceById(id, user);
    await this.serviceRepository.remove(service);
    return { message: 'Service deleted successfully' };
  }

  /**
   * Get all pending services (for superadmin review)
   */
  async getPendingServices(pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [services, total] = await this.serviceRepository.findAndCount({
      where: { status: ServiceStatus.PENDING },
      relations: ['created_by'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      services,
    };
  }

  /**
   * Get all services with status (for superadmin dashboard)
   */
  async getAllServicesWithStatus(pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [services, total] = await this.serviceRepository.findAndCount({
      relations: ['created_by'],
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      services,
    };
  }

  /**
   * Approve a service by superadmin
   */
  async approveService(id: number) {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    service.status = ServiceStatus.APPROVED;
    const saved = await this.serviceRepository.save(service);

    this.eventEmitter.emit(NotificationEvent.SERVICE_APPROVED, {
      providerId: service.created_by.id,
      serviceId: service.id,
      serviceName: service.name,
    });

    return saved;
  }

  /**
   * Reject a service by superadmin with optional reason
   */
  async rejectService(id: number, reason?: string) {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    service.status = ServiceStatus.REJECTED;
    if (reason) {
      service.rejection_reason = reason;
    }
    const saved = await this.serviceRepository.save(service);

    this.eventEmitter.emit(NotificationEvent.SERVICE_REJECTED, {
      providerId: service.created_by.id,
      serviceId: service.id,
      serviceName: service.name,
      reason,
    });

    return saved;
  }
}
