import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  ConversationReport,
  ConversationReportReason,
  ConversationReportStatus,
} from '@/modules/messaging/entities/conversation-report.entity';
import { Notification } from '@/modules/notifications/entities/notification.entity';

export const REPORT_STATUSES: ConversationReportStatus[] = [
  ConversationReportStatus.PENDING,
  ConversationReportStatus.REVIEWING,
  ConversationReportStatus.RESOLVED,
  ConversationReportStatus.DISMISSED,
];

export const REPORT_REASONS: ConversationReportReason[] = [
  ConversationReportReason.SPAM,
  ConversationReportReason.HARASSMENT,
  ConversationReportReason.HATE_SPEECH,
  ConversationReportReason.SCAM,
  ConversationReportReason.INAPPROPRIATE_CONTENT,
  ConversationReportReason.IMPERSONATION,
  ConversationReportReason.OTHER,
];

export const ANNOUNCEMENT_TAG = 'announcement';

/**
 * Admin-side reads + writes for the Communication section.
 *
 *   Inbox      — ConversationReports list + status transitions. The public
 *                MessagingService.reportConversation creates these; we add the
 *                admin's side of the workflow (review / resolve / dismiss).
 *   Announce.  — past broadcasts are derived from Notification rows tagged
 *                with `announcement`, grouped so one broadcast = one row.
 *   Push Log   — paginated read of every Notification row, with a tag filter.
 */
@Injectable()
export class AdminCommunicationService {
  constructor(
    @InjectRepository(ConversationReport)
    private readonly reports: Repository<ConversationReport>,
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
  ) {}

  // ---------- Inbox / reports -----------------------------------------

  async listReports(opts: {
    page: number;
    limit: number;
    status?: ConversationReportStatus | null;
    reason?: ConversationReportReason | null;
  }) {
    const { page, limit, status, reason } = opts;
    const qb = this.reports
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.reporter', 'reporter')
      .leftJoinAndSelect('r.reported_user', 'reported_user')
      .leftJoinAndSelect('r.message', 'message')
      .orderBy('r.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('r.status = :status', { status });
    if (reason) qb.andWhere('r.reason = :reason', { reason });

    const [rows, total] = await qb.getManyAndCount();
    return { rows, ...paginationMeta(total, page, limit) };
  }

  async reportStats() {
    const [open, total] = await Promise.all([
      this.reports.count({
        where: [
          { status: ConversationReportStatus.PENDING },
          { status: ConversationReportStatus.REVIEWING },
        ],
      }),
      this.reports.count(),
    ]);
    return { open, total, resolved: total - open };
  }

  async setReportStatus(id: string, status: ConversationReportStatus) {
    const report = await this.reports.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    report.status = status;
    await this.reports.save(report);
  }

  async getReportDetail(id: string) {
    const report = await this.reports.findOne({
      where: { id },
      relations: ['reporter', 'reported_user', 'message', 'conversation'],
    });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  // ---------- Announcements -------------------------------------------

  /**
   * Each broadcast produces one Notification row per recipient, so we group
   * by (title, message, sent-to-the-minute) to recover the original send.
   * `recipients` is the headcount for that broadcast.
   */
  async listAnnouncements(opts: { page: number; limit: number }) {
    const { page, limit } = opts;
    const offset = (page - 1) * limit;

    const rows = await this.notifications
      .createQueryBuilder('n')
      .select([
        `n.metadata->>'title' AS title`,
        'n.message AS message',
        `DATE_TRUNC('minute', n.created_at) AS sent_at`,
        'COUNT(*)::int AS recipients',
      ])
      .where('n.tag = :tag', { tag: ANNOUNCEMENT_TAG })
      .groupBy(`n.metadata->>'title', n.message, DATE_TRUNC('minute', n.created_at)`)
      .orderBy('sent_at', 'DESC')
      .offset(offset)
      .limit(limit)
      .getRawMany<{ title: string | null; message: string; sent_at: Date; recipients: number }>();

    const totalRow = await this.notifications
      .createQueryBuilder('n')
      .select(
        `COUNT(DISTINCT (n.metadata->>'title', n.message, DATE_TRUNC('minute', n.created_at)))::int`,
        'total',
      )
      .where('n.tag = :tag', { tag: ANNOUNCEMENT_TAG })
      .getRawOne<{ total: number }>();

    return { rows, ...paginationMeta(Number(totalRow?.total ?? 0), page, limit) };
  }

  // ---------- Push log -------------------------------------------------

  async listPushLog(opts: { page: number; limit: number; tag?: string | null }) {
    const { page, limit, tag } = opts;
    const qb = this.notifications
      .createQueryBuilder('n')
      .leftJoinAndSelect('n.user', 'user')
      .orderBy('n.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (tag) qb.andWhere('n.tag = :tag', { tag });

    const [rows, total] = await qb.getManyAndCount();
    return { rows, ...paginationMeta(total, page, limit) };
  }

  async distinctTags() {
    const rows = await this.notifications
      .createQueryBuilder('n')
      .select('DISTINCT n.tag', 'tag')
      .orderBy('tag', 'ASC')
      .getRawMany<{ tag: string }>();
    return rows.map((r) => r.tag).filter(Boolean);
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
