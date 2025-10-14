import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '@/modules/autodealer/entities/store.entity';
import { ForbiddenException } from '@nestjs/common';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

    async getAllStores() {
        return await this.storeRepository.find({
            order: { created_at: 'DESC' },
        });
    }

    async getStoreById(id: number) {
        const store = await this.storeRepository.findOne({ where: { id } });
        if (!store) throw new NotFoundException('Store not found');

        return store;
    }
}
