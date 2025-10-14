import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../entities/store.entity';
import { CreateStoreDto } from '../dto/create-store.dto';
import { User } from '@/modules/auth/entities/user.entity';
import { ForbiddenException } from '@nestjs/common';

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

    async getAllStores(user: User) {
        if (user.user_type !== 'auto dealer') {
            throw new ForbiddenException('Only auto dealers can view stores');
        }

        return await this.storeRepository.find({
            where: { created_by: { id: user.id } },
            order: { created_at: 'DESC' },
        });
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
