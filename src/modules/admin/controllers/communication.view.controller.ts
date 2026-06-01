import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { NotificationsService } from '@/modules/notifications/notifications.service';
import {
  ConversationReportReason,
  ConversationReportStatus,
} from '@/modules/messaging/entities/conversation-report.entity';

import {
  AdminCommunicationService,
  ANNOUNCEMENT_TAG,
  REPORT_REASONS,
  REPORT_STATUSES,
} from '../services/admin-communication.service';
import { extractFlash, redirectWithFlash, errorMessage } from '../util/flash';

const BROADCAST_AUDIENCES = [
  'all',
  'buyer',
  'auto dealer',
  'service provider',
  'driver',
  'driver employer',
] as const;
type BroadcastAudience = (typeof BROADCAST_AUDIENCES)[number];

/**
 * Communication section.
 *   GET  /admin/communication                           — redirect → inbox
 *   GET  /admin/communication/inbox                     — moderation queue
 *   GET  /admin/communication/inbox/:id/detail          — htmx detail modal
 *   POST /admin/communication/inbox/:id/status          — transition status
 *   GET  /admin/communication/announcements             — compose + history
 *   POST /admin/communication/announcements             — broadcast now
 *   GET  /admin/communication/notifications             — push log
 */
@Controller('admin/communication')
export class CommunicationViewController {
  constructor(
    private readonly comm: AdminCommunicationService,
    private readonly notifications: NotificationsService,
  ) {}

  @Get()
  index(@Res() res: Response) {
    return res.redirect('/admin/communication/inbox');
  }

  // ---------- Inbox ---------------------------------------------------

  @Get('inbox')
  async inbox_list(
    @Req() req: Request & { user?: unknown },
    @Res() res: Response,
    @Query('page') pageRaw?: string,
    @Query('status') statusRaw?: string,
    @Query('reason') reasonRaw?: string,
  ) {
    const page = parsePage(pageRaw);
    const limit = 20;
    const status = isReportStatus(statusRaw)
      ? (statusRaw as ConversationReportStatus)
      : null;
    const reason = isReportReason(reasonRaw)
      ? (reasonRaw as ConversationReportReason)
      : null;

    const [result, stats] = await Promise.all([
      this.comm.listReports({ page, limit, status, reason }),
      this.comm.reportStats(),
    ]);

    return res.render('admin/communication/inbox', {
      title: 'Communication · Inbox',
      active: 'communication',
      tab: 'inbox',
      admin: req.user,
      reports: result.rows,
      pagination: result,
      stats,
      reportStatuses: REPORT_STATUSES,
      reportReasons: REPORT_REASONS,
      statusFilter: status,
      reasonFilter: reason,
      flash: extractFlash(req),
    });
  }

  @Get('inbox/:id/detail')
  async inbox_detail(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    try {
      const report = await this.comm.getReportDetail(id);
      return res.render('admin/communication/_report-modal', {
        report,
        reportStatuses: REPORT_STATUSES,
      });
    } catch (e) {
      return res.status(404).render('admin/users/_modal-error', {
        message: errorMessage(e),
      });
    }
  }

  @Post('inbox/:id/status')
  async inbox_setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status?: string },
    @Res() res: Response,
  ) {
    try {
      if (!isReportStatus(body.status)) {
        throw new BadRequestException('Invalid status.');
      }
      await this.comm.setReportStatus(id, body.status as ConversationReportStatus);
      return redirectWithFlash(
        res,
        '/admin/communication/inbox',
        'success',
        `Report marked as ${body.status}.`,
      );
    } catch (e) {
      return redirectWithFlash(res, '/admin/communication/inbox', 'error', errorMessage(e));
    }
  }

  // ---------- Announcements -------------------------------------------

  @Get('announcements')
  async announcements_list(
    @Req() req: Request & { user?: unknown },
    @Res() res: Response,
    @Query('page') pageRaw?: string,
  ) {
    const page = parsePage(pageRaw);
    const limit = 20;
    const result = await this.comm.listAnnouncements({ page, limit });

    return res.render('admin/communication/announcements', {
      title: 'Communication · Announcements',
      active: 'communication',
      tab: 'announcements',
      admin: req.user,
      announcements: result.rows,
      pagination: result,
      audiences: BROADCAST_AUDIENCES,
      flash: extractFlash(req),
    });
  }

  @Post('announcements')
  async announcements_send(
    @Body() body: { title?: string; body?: string; audience?: string },
    @Res() res: Response,
  ) {
    try {
      const title = body.title?.trim();
      const message = body.body?.trim();
      if (!title) throw new BadRequestException('Title is required.');
      if (!message) throw new BadRequestException('Message is required.');

      const audience = isAudience(body.audience) ? (body.audience as BroadcastAudience) : 'all';

      const result = await this.notifications.broadcast({
        tag: ANNOUNCEMENT_TAG,
        title,
        body: message,
        // 'all' → omit userType so broadcast hits everyone.
        ...(audience !== 'all' ? { userType: audience } : {}),
      });

      const recipients = (result as { recipients?: number })?.recipients ?? 0;
      return redirectWithFlash(
        res,
        '/admin/communication/announcements',
        'success',
        `Announcement sent to ${recipients} ${recipients === 1 ? 'recipient' : 'recipients'}.`,
      );
    } catch (e) {
      return redirectWithFlash(
        res,
        '/admin/communication/announcements',
        'error',
        errorMessage(e),
      );
    }
  }

  // ---------- Push log ------------------------------------------------

  @Get('notifications')
  async notifications_log(
    @Req() req: Request & { user?: unknown },
    @Res() res: Response,
    @Query('page') pageRaw?: string,
    @Query('tag') tagRaw?: string,
  ) {
    const page = parsePage(pageRaw);
    const limit = 20;
    const tag = tagRaw?.trim() || null;

    const [result, tags] = await Promise.all([
      this.comm.listPushLog({ page, limit, tag }),
      this.comm.distinctTags(),
    ]);

    return res.render('admin/communication/notifications', {
      title: 'Communication · Notifications',
      active: 'communication',
      tab: 'notifications',
      admin: req.user,
      notifications: result.rows,
      pagination: result,
      tags,
      tagFilter: tag,
      flash: extractFlash(req),
    });
  }
}

// ---------- helpers ------------------------------------------------------

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

function isReportStatus(v: unknown): boolean {
  return typeof v === 'string' && (REPORT_STATUSES as readonly string[]).includes(v);
}
function isReportReason(v: unknown): boolean {
  return typeof v === 'string' && (REPORT_REASONS as readonly string[]).includes(v);
}
function isAudience(v: unknown): boolean {
  return typeof v === 'string' && (BROADCAST_AUDIENCES as readonly string[]).includes(v);
}
