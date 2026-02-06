import { Body, Controller, Post, Get, Param, Patch, Delete, UseGuards, UsePipes, Req, Res, HttpStatus } from '@nestjs/common';
import { ServiceAttributeService } from '../service/service-attribute.service';
import { CreateServiceAttributeDto } from '../dto/create-service-attribute.dto';
import { JoiValidationPipe } from '@/pipes/joi.validation.pipe';
import { SuperAuthGuard } from '@/guards/super-permissions.guard';
import { SuperAdminRequest } from '@/definitions';
import { Response } from 'express';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { createServiceAttributeValidation } from '../validations/service-attribute.validation';
import { SUPERADMIN_AUTH_COOKIE } from '@/constants';

@ApiCookieAuth(SUPERADMIN_AUTH_COOKIE)
@UseGuards(SuperAuthGuard)
@ApiTags('Super Admin - Service Attributes')
@Controller('superadmin/service-attributes')
export class ServiceAttributeController {
  constructor(private readonly serviceAttributeService: ServiceAttributeService) {}

  @Post()
  @UsePipes(new JoiValidationPipe(createServiceAttributeValidation))
  async createServiceAttribute(@Body() dto: CreateServiceAttributeDto, @Req() req: SuperAdminRequest, @Res() res: Response) {
    const serviceAttribute = await this.serviceAttributeService.createServiceAttribute(dto, req.user);
    return res.status(HttpStatus.CREATED).json({ success: true, data: serviceAttribute });
  }

  @Get()
  async getAllServiceAttributes(@Res() res: Response) {
    const serviceAttributes = await this.serviceAttributeService.getAllServiceAttributes();
    return res.status(HttpStatus.OK).json({ success: true, data: serviceAttributes });
  }

  @Get('by-type/:attribute_type')
  async getServiceAttributesByType(@Param('attribute_type') attribute_type: string, @Res() res: Response) {
    const serviceAttributes = await this.serviceAttributeService.getServiceAttributesByType(attribute_type);
    return res.status(HttpStatus.OK).json({ success: true, data: serviceAttributes });
  }

  @Get(':id')
  async getServiceAttribute(@Param('id') id: number, @Res() res: Response) {
    const serviceAttribute = await this.serviceAttributeService.getServiceAttributeById(id);
    return res.status(HttpStatus.OK).json({ success: true, data: serviceAttribute });
  }

  @Patch(':id')
  @UsePipes(new JoiValidationPipe(createServiceAttributeValidation))
  async updateServiceAttribute(@Param('id') id: number, @Body() dto: CreateServiceAttributeDto,
    @Req() req: SuperAdminRequest,
    @Res() res: Response
  ) {
    const updatedServiceAttribute = await this.serviceAttributeService.updateServiceAttribute(id, dto, req.user);
    return res.status(HttpStatus.OK).json({
      success: true,
      data: updatedServiceAttribute,
    });
  }

  @Delete(':id')
  async deleteServiceAttribute(@Param('id') id: number, @Req() req: SuperAdminRequest, @Res() res: Response) {
    const result = await this.serviceAttributeService.deleteServiceAttribute(id);
    return res.status(HttpStatus.OK).json({ success: true, ...result });
  }
}
