import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AnalyticsEvent,
  AnalyticsEventType,
  AnalyticsResourceType,
} from '../entities/analytics-event.entity';

export interface MonthlyStatsBucket {
  bucket: string;
  views: number;
  clicks: number;
  enquiries: number;
}

export interface MonthlyStats {
  totals: { views: number; clicks: number; enquiries: number };
  series: MonthlyStatsBucket[];
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly eventRepository: Repository<AnalyticsEvent>,
  ) {}

  async logEvent(params: {
    resource_type: AnalyticsResourceType;
    resource_id: number;
    event_type: AnalyticsEventType;
    user_id: number;
  }): Promise<void> {
    await this.eventRepository.insert(params);
  }

  async getMonthlyStats(
    resource_type: AnalyticsResourceType,
    resource_ids: number[],
  ): Promise<MonthlyStats> {
    const now = new Date();
    const series: MonthlyStatsBucket[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      series.push({ bucket: key, views: 0, clicks: 0, enquiries: 0 });
    }

    if (resource_ids.length === 0) {
      return { totals: { views: 0, clicks: 0, enquiries: 0 }, series };
    }

    const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const rows: Array<{ bucket: Date; event_type: AnalyticsEventType; count: string }> =
      await this.eventRepository
        .createQueryBuilder('event')
        .select(`date_trunc('month', event.created_at)`, 'bucket')
        .addSelect('event.event_type', 'event_type')
        .addSelect('COUNT(*)', 'count')
        .where('event.resource_type = :resource_type', { resource_type })
        .andWhere('event.resource_id IN (:...resource_ids)', { resource_ids })
        .andWhere('event.created_at >= :start', { start })
        .groupBy('bucket')
        .addGroupBy('event.event_type')
        .getRawMany();

    for (const row of rows) {
      const d = new Date(row.bucket);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      const entry = series.find((s) => s.bucket === key);
      if (!entry) continue;
      const count = Number(row.count);
      if (row.event_type === AnalyticsEventType.VIEW) entry.views = count;
      else if (row.event_type === AnalyticsEventType.CLICK) entry.clicks = count;
      else if (row.event_type === AnalyticsEventType.ENQUIRY) entry.enquiries = count;
    }

    const totals = series.reduce(
      (acc, s) => ({
        views: acc.views + s.views,
        clicks: acc.clicks + s.clicks,
        enquiries: acc.enquiries + s.enquiries,
      }),
      { views: 0, clicks: 0, enquiries: 0 },
    );

    return { totals, series };
  }
}
