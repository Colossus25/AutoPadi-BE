import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductAttribute } from '../entities/product-attribute.entity';
import { CreateProductAttributeDto } from '../dto/create-product-attribute.dto';
import { SuperAdmin } from '../entities/super-admin.entity';

@Injectable()
export class ProductAttributeService {
  constructor(
    @InjectRepository(ProductAttribute)
    private readonly productAttributeRepository: Repository<ProductAttribute>,
  ) {}

  async createProductAttribute(dto: CreateProductAttributeDto, superadmin: SuperAdmin) {
    const productAttribute = this.productAttributeRepository.create({
      ...dto,
      created_by: superadmin,
    });
    return await this.productAttributeRepository.save(productAttribute);
  }

  async getAllProductAttributes() {
    return await this.productAttributeRepository.find({ order: { attribute_type: 'ASC', value: 'ASC' } });
  }

  async getProductAttributesByType(attribute_type: string) {
    return await this.productAttributeRepository.find({
      where: { attribute_type: attribute_type as any },
      order: { value: 'ASC' },
    });
  }

  async getProductAttributeById(id: number) {
    const productAttribute = await this.productAttributeRepository.findOne({ where: { id } });
    if (!productAttribute) throw new NotFoundException('Product attribute not found');
    return productAttribute;
  }

  async updateProductAttribute(id: number, dto: CreateProductAttributeDto, superadmin: SuperAdmin) {
    const productAttribute = await this.getProductAttributeById(id);
    Object.assign(productAttribute, {
      ...dto,
      updated_by: superadmin,
    });
    return await this.productAttributeRepository.save(productAttribute);
  }

  async deleteProductAttribute(id: number) {
    const productAttribute = await this.getProductAttributeById(id);
    await this.productAttributeRepository.remove(productAttribute);
    return { message: 'Product attribute deleted successfully' };
  }
}
