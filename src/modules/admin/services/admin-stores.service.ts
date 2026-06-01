import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Store } from '@/modules/autodealer/entities/store.entity';
import { Product } from '@/modules/autodealer/entities/product.entity';

/**
 * Admin-side reads for the Store Management section.
 *
 * The public StoreService.getAllStores is owner-scoped (returns only the
 * caller's stores), so the admin needs its own list query. Similarly for the
 * detail view: the public getStoreById throws if the caller isn't the owner.
 *
 * No "suspended" status yet — Store has no @DeleteDateColumn, and we agreed
 * to stub status in the UI before introducing a schema change. When a real
 * status column lands, the only change needed here is an extra
 * `andWhere('status = …')` and a `setStatus()` action.
 */
@Injectable()
export class AdminStoresService {
  constructor(
    @InjectRepository(Store) private readonly stores: Repository<Store>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
  ) {}

  async list(opts: { page: number; limit: number; q?: string | null }) {
    const { page, limit, q } = opts;
    const qb = this.stores
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.created_by', 'owner')
      .orderBy('s.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (q && q.trim()) {
      const needle = `%${q.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(s.name) LIKE :n OR LOWER(s.address) LIKE :n OR LOWER(s.email) LIKE :n OR LOWER(s.phone) LIKE :n)',
        { n: needle },
      );
    }

    const [rows, total] = await qb.getManyAndCount();
    return { rows, ...paginationMeta(total, page, limit) };
  }

  /** Aggregate counters for the page header stat cards. */
  async stats() {
    const [totalStores, totalProducts, viewsRow] = await Promise.all([
      this.stores.count(),
      this.products.count(),
      this.stores
        .createQueryBuilder('s')
        .select('COALESCE(SUM(s.views_count), 0)', 'sum')
        .getRawOne<{ sum: string }>(),
    ]);
    const totalViews = Number(viewsRow?.sum ?? 0);
    return { totalStores, totalProducts, totalViews };
  }

  /** Store detail used by the htmx-fetched modal. */
  async detail(id: number) {
    const store = await this.stores.findOne({
      where: { id },
      relations: ['created_by'],
    });
    if (!store) throw new NotFoundException('Store not found');

    const [productCount, topProducts, engagementRow] = await Promise.all([
      this.products.count({ where: { store: { id } } }),
      this.products.find({
        where: { store: { id } },
        order: { clicks_count: 'DESC' },
        take: 5,
      }),
      this.products
        .createQueryBuilder('p')
        .select('COALESCE(SUM(p.clicks_count), 0)', 'clicks')
        .addSelect('COALESCE(SUM(p.enquiries_count), 0)', 'enquiries')
        .where('p.store_id = :id', { id })
        .getRawOne<{ clicks: string; enquiries: string }>(),
    ]);

    return {
      store,
      productCount,
      topProducts,
      totalClicks: Number(engagementRow?.clicks ?? 0),
      totalEnquiries: Number(engagementRow?.enquiries ?? 0),
    };
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
