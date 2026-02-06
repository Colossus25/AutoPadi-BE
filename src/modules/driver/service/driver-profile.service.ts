import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverProfile } from '../entities/driver-profile.entity';
import { CreateDriverProfileDto } from '../dto/create-driver-profile.dto';
import { User } from '@/modules/auth/entities/user.entity';
import { PaginationDto } from '@/modules/global/common/dto/pagination.dto';

@Injectable()
export class DriverProfileService {
  constructor(
    @InjectRepository(DriverProfile)
    private readonly driverProfileRepository: Repository<DriverProfile>,
  ) {}

  async createDriverProfile(dto: CreateDriverProfileDto, user: User) {
    if (user.user_type !== 'driver') {
      throw new ForbiddenException('Only drivers can create a driver profile');
    }
    const driverProfile = this.driverProfileRepository.create({
      ...dto,
      created_by: user,
    });
    return await this.driverProfileRepository.save(driverProfile);
  }

  async getAllDriverProfiles(user: User, pagination: PaginationDto) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    if (user.user_type !== 'driver') {
      throw new ForbiddenException('Only drivers can view driver profiles');
    }

    const [driverProfiles, total] = await this.driverProfileRepository.findAndCount({
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
      driverProfiles,
    };
  }

  async getDriverProfileById(id: number, user: User) {
    const driverProfile = await this.driverProfileRepository.findOne({ where: { id } });
    if (!driverProfile) throw new NotFoundException('Driver profile not found');
    if (driverProfile.created_by.id !== user.id) {
      throw new ForbiddenException('You can only view your own driver profile');
    }
    return driverProfile;
  }

  async updateDriverProfile(id: number, dto: CreateDriverProfileDto, user: User) {
    const driverProfile = await this.getDriverProfileById(id, user);
    Object.assign(driverProfile, {
      ...dto,
      updated_by: user,
    });
    return await this.driverProfileRepository.save(driverProfile);
  }

  async deleteDriverProfile(id: number, user: User) {
    const driverProfile = await this.getDriverProfileById(id, user);
    await this.driverProfileRepository.remove(driverProfile);
    return { message: 'Driver profile deleted successfully' };
  }
}
