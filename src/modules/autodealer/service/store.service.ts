import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../entities/store.entity';
import { CreateStoreDto } from '../dto/create-store.dto';
import { User } from '@/modules/auth/entities/user.entity';
import { ForbiddenException } from '@nestjs/common';
import { PaginationDto } from '@/modules/global/common/dto/pagination.dto';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

    async createStore(dto: CreateStoreDto, user: User) {
          if (user.user_type !== 'auto dealer') {
            throw new ForbiddenException('Only auto dealers can create a store');
        }

        const store = this.storeRepository.create({
            ...dto,
            created_by: user,
        });
        return await this.storeRepository.save(store);
    }

    async getAllStores(user: User, pagination: PaginationDto) {
        const { page = 1, limit = 10 } = pagination;
        const skip = (page - 1) * limit;

        if (user.user_type !== 'auto dealer') {
            throw new ForbiddenException('Only auto dealers can view stores');
        }

        const [ stores, total ] = await this.storeRepository.findAndCount({
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
            stores,
        }
    }

    async getStoreById(id: number, user: User) {
        const store = await this.storeRepository.findOne({ where: { id } });
        if (!store) throw new NotFoundException('Store not found');

        if (store.created_by.id !== user.id) {
            throw new ForbiddenException('You can only view your own stores');
        }

        return store;
    }

    async updateStore(id: number, dto: CreateStoreDto, user: User) {
        const store = await this.getStoreById(id, user);

        Object.assign(store, {
            ...dto,
            updated_by: user,
        });

        return await this.storeRepository.save(store);
    }

    async deleteStore(id: number, user: User) {
        const store = await this.getStoreById(id, user);

        await this.storeRepository.remove(store);

        return { message: 'Store deleted successfully' };
    }
}
