import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceAttribute } from '../entities/service-attribute.entity';
import { CreateServiceAttributeDto } from '../dto/create-service-attribute.dto';
import { SuperAdmin } from '../entities/super-admin.entity';

@Injectable()
export class ServiceAttributeService {
  constructor(
    @InjectRepository(ServiceAttribute)
    private readonly serviceAttributeRepository: Repository<ServiceAttribute>,
  ) {}

  async createServiceAttribute(dto: CreateServiceAttributeDto, superadmin: SuperAdmin) {
    const serviceAttribute = this.serviceAttributeRepository.create({
      ...dto,
      created_by: superadmin,
    });
    return await this.serviceAttributeRepository.save(serviceAttribute);
  }

  async getAllServiceAttributes() {
    return await this.serviceAttributeRepository.find({ order: { attribute_type: 'ASC', value: 'ASC' } });
  }

  async getServiceAttributesByType(attribute_type: string) {
    return await this.serviceAttributeRepository.find({
      where: { attribute_type: attribute_type as any },
      order: { value: 'ASC' },
    });
  }

  async getServiceAttributeById(id: number) {
    const serviceAttribute = await this.serviceAttributeRepository.findOne({ where: { id } });
    if (!serviceAttribute) throw new NotFoundException('Service attribute not found');
    return serviceAttribute;
  }

  async updateServiceAttribute(id: number, dto: CreateServiceAttributeDto, superadmin: SuperAdmin) {
    const serviceAttribute = await this.getServiceAttributeById(id);
    Object.assign(serviceAttribute, {
      ...dto,
      updated_by: superadmin,
    });
    return await this.serviceAttributeRepository.save(serviceAttribute);
  }

  async deleteServiceAttribute(id: number) {
    const serviceAttribute = await this.getServiceAttributeById(id);
    await this.serviceAttributeRepository.remove(serviceAttribute);
    return { message: 'Service attribute deleted successfully' };
  }
}
