import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverJob } from '../entities/driver-job.entity';
import { CreateDriverJobDto } from '../dto/create-driver-job.dto';
import { User } from '@/modules/auth/entities/user.entity';
import { PaginationDto } from '@/modules/global/common/dto/pagination.dto';

@Injectable()
export class DriverJobService {
  constructor(
    @InjectRepository(DriverJob)
    private readonly driverJobRepository: Repository<DriverJob>,
  ) {}

  async createDriverJob(dto: CreateDriverJobDto, user: User) {
    if (user.user_type !== 'driver employer') {
      throw new ForbiddenException('Only driver employers can create a driving job');
    }
    const driverJob = this.driverJobRepository.create({
      ...dto,
      created_by: user,
    });
    return await this.driverJobRepository.save(driverJob);
  }

  async getAllDriverJobs(user: User, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    if (user.user_type !== 'driver employer') {
      throw new ForbiddenException('Only driver employers can view driving jobs');
    }

    const [driverJobs, total] = await this.driverJobRepository.findAndCount({
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
      driverJobs,
    };
  }

  async getDriverJobById(id: number, user: User) {
    const driverJob = await this.driverJobRepository.findOne({ where: { id } });
    if (!driverJob) throw new NotFoundException('Driving job not found');
    if (driverJob.created_by.id !== user.id) {
      throw new ForbiddenException('You can only view your own driving jobs');
    }
    return driverJob;
  }

  async updateDriverJob(id: number, dto: CreateDriverJobDto, user: User) {
    const driverJob = await this.getDriverJobById(id, user);
    Object.assign(driverJob, {
      ...dto,
      updated_by: user,
    });
    return await this.driverJobRepository.save(driverJob);
  }

  async deleteDriverJob(id: number, user: User) {
    const driverJob = await this.getDriverJobById(id, user);
    await this.driverJobRepository.remove(driverJob);
    return { message: 'Driving job deleted successfully' };
  }
}
