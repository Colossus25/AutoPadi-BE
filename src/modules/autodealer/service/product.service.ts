import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { User } from '@/modules/auth/entities/user.entity';
import { ForbiddenException } from '@nestjs/common';
import { Store } from '../entities/store.entity';
import { PaginationDto } from '@/modules/global/common/dto/pagination.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

    async createProduct(dto: CreateProductDto, user: User) {
        if (user.user_type !== 'auto dealer') {
            throw new ForbiddenException('Only auto dealers can create a product');
        }

        const store = await this.storeRepository.findOne({
            where: { 
                id: dto.store_id,
                created_by: { id: user.id }
            },
        });

        if (!store) {
            throw new NotFoundException('Store not found or does not belong to you');
        }

        const product = this.productRepository.create({
            ...dto,
            store,
            created_by: user,
        });

        return await this.productRepository.save(product);
    }

    async getAllProducts(user: User, pagination: PaginationDto) {
        const { page = 1, limit = 100 } = pagination;
        const skip = (page - 1) * limit;

        if (user.user_type !== 'auto dealer') {
            throw new ForbiddenException('Only auto dealers can view products');
        }

        const [ products, total ] = await this.productRepository.findAndCount({
            where: { created_by: { id: user.id } },
            order: { created_at: 'DESC' },
            skip,
            take: limit,
        });

        return {
             meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            products,
        }
    }

    async getProductById(id: number, user: User) {
        const product = await this.productRepository.findOne({ where: { id } });
        if (!product) throw new NotFoundException('Product not found');

        if (product.created_by.id !== user.id) {
            throw new ForbiddenException('You can only view your own products');
        }

        return product;
    }

    async updateProduct(id: number, dto: CreateProductDto, user: User) {
        const product = await this.getProductById(id, user);

        Object.assign(product, {
            ...dto,
            updated_by: user,
        });

        return await this.productRepository.save(product);
    }

    async deleteProduct(id: number, user: User) {
        const product = await this.getProductById(id, user);

        await this.productRepository.remove(product);

        return { message: 'Product deleted successfully' };
    }
}
