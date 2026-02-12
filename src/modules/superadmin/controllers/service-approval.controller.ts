import { Controller, Get, Patch, Param, Body, UseGuards, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { AuthGuard } from '@/guards';
import { _AUTH_COOKIE_NAME_ } from '@/constants';
import { ServiceService } from '@/modules/serviceprovider/service/service.service';
import { PaginationDto } from '@/modules/global/common/dto/pagination.dto';

@ApiCookieAuth(_AUTH_COOKIE_NAME_)
@UseGuards(AuthGuard)
@ApiTags('Superadmin - Service Approvals')
@Controller('superadmin/services')
export class ServiceApprovalController {
  constructor(private readonly serviceService: ServiceService) {}

  /**
   * Get all pending services (for review)
   */
  @Get('pending')
  async getPendingServices(@Query() pagination: PaginationDto, @Res() res: Response) {
    const services = await this.serviceService.getPendingServices(pagination);
    return res.status(200).json({ success: true, data: services });
  }

  /**
   * Approve a service
   */
  @Patch(':id/approve')
  async approveService(@Param('id') id: number, @Res() res: Response) {
    const result = await this.serviceService.approveService(id);
    return res.status(200).json({ success: true, data: result });
  }

  /**
   * Reject a service with optional reason
   */
  @Patch(':id/reject')
  async rejectService(
    @Param('id') id: number,
    @Body() body: { reason?: string },
    @Res() res: Response,
  ) {
    const result = await this.serviceService.rejectService(id, body.reason);
    return res.status(200).json({ success: true, data: result });
  }

  /**
   * Get all services with approval status
   */
  @Get()
  async getAllServices(@Query() pagination: PaginationDto, @Res() res: Response) {
    const services = await this.serviceService.getAllServicesWithStatus(pagination);
    return res.status(200).json({ success: true, data: services });
  }
}
