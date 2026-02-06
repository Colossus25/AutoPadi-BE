import { Body, Controller, Post, Get, Param, Patch, Delete, UseGuards, UsePipes, Req, Res, HttpStatus, Query } from '@nestjs/common';
import { ProductAttributeService } from '../service/product-attribute.service';
import { CreateProductAttributeDto } from '../dto/create-product-attribute.dto';
import { JoiValidationPipe } from '@/pipes/joi.validation.pipe';
import { SuperAuthGuard } from '@/guards/super-permissions.guard';
import { SuperAdminRequest } from '@/definitions';
import { Response } from 'express';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { createProductAttributeValidation } from '../validations/product-attribute.validation';
import { SUPERADMIN_AUTH_COOKIE } from '@/constants';

@ApiCookieAuth(SUPERADMIN_AUTH_COOKIE)
@UseGuards(SuperAuthGuard)
@ApiTags('Super Admin - Product Attributes')
@Controller('superadmin/product-attributes')
export class ProductAttributeController {
  constructor(private readonly productAttributeService: ProductAttributeService) {}

  @Post()
  @UsePipes(new JoiValidationPipe(createProductAttributeValidation))
  async createProductAttribute(@Body() dto: CreateProductAttributeDto, @Req() req: SuperAdminRequest, @Res() res: Response) {
    const productAttribute = await this.productAttributeService.createProductAttribute(dto, req.user);
    return res.status(HttpStatus.CREATED).json({ success: true, data: productAttribute });
  }

  @Get()
  async getAllProductAttributes(@Res() res: Response) {
    const productAttributes = await this.productAttributeService.getAllProductAttributes();
    return res.status(HttpStatus.OK).json({ success: true, data: productAttributes });
  }

  @Get('by-type/:attribute_type')
  async getProductAttributesByType(@Param('attribute_type') attribute_type: string, @Res() res: Response) {
    const productAttributes = await this.productAttributeService.getProductAttributesByType(attribute_type);
    return res.status(HttpStatus.OK).json({ success: true, data: productAttributes });
  }

  @Get(':id')
  async getProductAttribute(@Param('id') id: number, @Res() res: Response) {
    const productAttribute = await this.productAttributeService.getProductAttributeById(id);
    return res.status(HttpStatus.OK).json({ success: true, data: productAttribute });
  }

  @Patch(':id')
  @UsePipes(new JoiValidationPipe(createProductAttributeValidation))
  async updateProductAttribute(@Param('id') id: number, @Body() dto: CreateProductAttributeDto,
    @Req() req: SuperAdminRequest,
    @Res() res: Response
  ) {
    const updatedProductAttribute = await this.productAttributeService.updateProductAttribute(id, dto, req.user);
    return res.status(HttpStatus.OK).json({
      success: true,
      data: updatedProductAttribute,
    });
  }

  @Delete(':id')
  async deleteProductAttribute(@Param('id') id: number, @Req() req: SuperAdminRequest, @Res() res: Response) {
    const result = await this.productAttributeService.deleteProductAttribute(id);
    return res.status(HttpStatus.OK).json({ success: true, ...result });
  }
}
