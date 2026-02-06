import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../entities/service.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { User } from '@/modules/auth/entities/user.entity';
import { PaginationDto } from '@/modules/global/common/dto/pagination.dto';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async createService(dto: CreateServiceDto, user: User) {
    if (user.user_type !== 'service provider') {
      throw new ForbiddenException('Only service providers can create a service');
    }
    const service = this.serviceRepository.create({
      ...dto,
      created_by: user,
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
    return service;
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
}
