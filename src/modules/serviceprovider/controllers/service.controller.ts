import { Body, Controller, Post, Get, Param, Patch, Delete, UseGuards, UsePipes, Req, Res, HttpStatus, Query } from '@nestjs/common';
import { ServiceService } from '../service/service.service';
import { CreateServiceDto } from '../dto/create-service.dto';
import { JoiValidationPipe } from '@/pipes/joi.validation.pipe';
import { AuthGuard } from '@/guards';
import { UserRequest } from '@/definitions';
import { Response } from 'express';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { createServiceValidation } from '../validations/service.validation';
import { _AUTH_COOKIE_NAME_ } from '@/constants';
import { PaginationDto } from '@/modules/global/common/dto/pagination.dto';

@ApiCookieAuth(_AUTH_COOKIE_NAME_)
@UseGuards(AuthGuard)
@ApiTags('Service Provider - Services')
@Controller('serviceprovider/service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  @UsePipes(new JoiValidationPipe(createServiceValidation))
  async createService(@Body() dto: CreateServiceDto, @Req() req: UserRequest, @Res() res: Response) {
    const service = await this.serviceService.createService(dto, req.user);
    return res.status(HttpStatus.CREATED).json({ success: true, data: service });
  }

  @Get()
  async getAllServices(@Req() req: UserRequest, @Query() pagination: PaginationDto, @Res() res: Response) {
    const services = await this.serviceService.getAllServices(req.user, pagination);
    return res.status(HttpStatus.OK).json({ success: true, data: services });
  }

  @Get(':id')
  async getService(@Param('id') id: number, @Req() req: UserRequest, @Res() res: Response) {
    const service = await this.serviceService.getServiceById(id, req.user);
    return res.status(HttpStatus.OK).json({ success: true, data: service });
  }

  @Patch(':id')
  @UsePipes(new JoiValidationPipe(createServiceValidation))
  async updateService(
    @Param('id') id: number,
    @Body() dto: CreateServiceDto,
    @Req() req: UserRequest,
    @Res() res: Response
  ) {
    const updatedService = await this.serviceService.updateService(id, dto, req.user);
    return res.status(HttpStatus.OK).json({
      success: true,
      data: updatedService,
    });
  }

  @Delete(':id')
  async deleteService(@Param('id') id: number, @Req() req: UserRequest, @Res() res: Response) {
    const result = await this.serviceService.deleteService(id, req.user);
    return res.status(HttpStatus.OK).json({ success: true, ...result });
  }
}
