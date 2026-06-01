import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from '@/modules/autodealer/entities/product.entity';
import {
  Service,
  ServiceStatus,
} from '@/modules/serviceprovider/entities/service.entity';

/**
 * Admin-side reads for the Listings section.
 *
 * Products: the public ProductService.getAllProducts is user-scoped and throws
 *   ForbiddenException for non-dealers, so we query the repo directly here.
 * Services: ServiceService.getAllServicesWithStatus paginates everything but
 *   doesn't filter by status, and getPendingServices only returns pending —
 *   neither covers "show me just the rejected ones." This service adds that.
 */
@Injectable()
export class AdminListingsService {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Service) private readonly services: Repository<Service>,
  ) {}

  async listProducts(opts: { page: number; limit: number }) {
    const { page, limit } = opts;
    const [rows, total] = await this.products.findAndCount({
      relations: ['store', 'created_by'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { rows, ...paginationMeta(total, page, limit) };
  }

  async listServices(opts: {
    page: number;
    limit: number;
    status?: ServiceStatus | null;
  }) {
    const { page, limit, status } = opts;
    const qb = this.services
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.created_by', 'creator')
      .orderBy('s.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('s.status = :status', { status });

    const [rows, total] = await qb.getManyAndCount();
    return { rows, ...paginationMeta(total, page, limit) };
  }
}

function paginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    total,
    page,
    limit,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    prevPage: Math.max(1, page - 1),
    nextPage: Math.min(totalPages, page + 1),
  };
}
