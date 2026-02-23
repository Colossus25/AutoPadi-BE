import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverJob } from '../entities/driver-job.entity';
import { DriverProfile } from '@/modules/driver/entities/driver-profile.entity';
import { CreateDriverJobDto } from '../dto/create-driver-job.dto';
import { User } from '@/modules/auth/entities/user.entity';
import { PaginationDto } from '@/modules/global/common/dto/pagination.dto';

@Injectable()
export class DriverJobService {
  constructor(
    @InjectRepository(DriverJob)
    private readonly driverJobRepository: Repository<DriverJob>,
    @InjectRepository(DriverProfile)
    private readonly driverProfileRepository: Repository<DriverProfile>,
  ) {}

  async createDriverJob(dto: CreateDriverJobDto, user: User, userSubscription?: any) {
    if (user.user_type !== 'driver employer') {
      throw new ForbiddenException('Only driver employers can create a driving job');
    }
    const driverJob = this.driverJobRepository.create({
      ...dto,
      created_by: user,
      user_subscription: userSubscription || null,
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

  /**
   * Find matched drivers for a job based on job requirements
   * Matching criteria: vehicle types, experience, license, education, preferences
   */
  async getMatchedDrivers(jobId: number, user: User, pagination: PaginationDto) {
    if (user.user_type !== 'driver employer') {
      throw new ForbiddenException('Only driver employers can view matched drivers');
    }

    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    // Get the job posting
    const job = await this.driverJobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.created_by.id !== user.id) {
      throw new ForbiddenException('You can only view drivers matched to your own jobs');
    }

    // Start building query for drivers - will apply soft filters (suggestions, not strict requirements)
    let query = this.driverProfileRepository.createQueryBuilder('driver');
    let hasFilters = false;

    // Apply filters as soft suggestions
    const conditions: string[] = [];
    const params: any = {};

    // Vehicle type match (soft preference)
    if (job.type_of_vehicles && job.type_of_vehicles.length > 0) {
      const vehicleConditions = job.type_of_vehicles
        .map((vehicle, idx) => `driver.type_of_vehicles LIKE :vehicle${idx}`)
        .join(' OR ');
      conditions.push(`(${vehicleConditions})`);
      job.type_of_vehicles.forEach((vehicle, idx) => {
        params[`vehicle${idx}`] = `%${vehicle}%`;
      });
      hasFilters = true;
    }

    // Experience match (soft preference)
    if (job.driver_years_of_experience !== null && job.driver_years_of_experience !== undefined) {
      conditions.push('(driver.years_of_experience >= :requiredExp)');
      params['requiredExp'] = job.driver_years_of_experience;
      hasFilters = true;
    }

    // Gender preference (soft match)
    if (job.driver_gender) {
      conditions.push('(driver.gender = :gender OR driver.gender IS NULL)');
      params['gender'] = job.driver_gender;
      hasFilters = true;
    }

    // Age range preference (soft match - ±5 years is flexible)
    if (job.driver_age) {
      conditions.push('(driver.age BETWEEN :minAge AND :maxAge OR driver.age IS NULL)');
      params['minAge'] = job.driver_age - 5;
      params['maxAge'] = job.driver_age + 5;
      hasFilters = true;
    }

    // License match (soft preference)
    if (job.valid_driver_license) {
      conditions.push('(driver.valid_driver_license IS NOT NULL)');
      hasFilters = true;
    }

    // Education match (soft preference)
    if (job.driver_level_of_education) {
      conditions.push('(driver.level_of_education = :eduLevel OR driver.level_of_education IS NULL)');
      params['eduLevel'] = job.driver_level_of_education;
      hasFilters = true;
    }

    // Marital status match (soft preference)
    if (job.driver_marital_status) {
      conditions.push('(driver.marital_status = :maritalStatus OR driver.marital_status IS NULL)');
      params['maritalStatus'] = job.driver_marital_status;
      hasFilters = true;
    }

    // Location/relocation match (soft preference)
    if (job.driver_must_reside_in_state) {
      const addressParts = job.address?.split(',') || [];
      const jobState = addressParts[addressParts.length - 1]?.trim() || 'Lagos';
      conditions.push('(driver.open_to_relocation = :relocation OR driver.address LIKE :jobState OR driver.relocation_state LIKE :jobState)');
      params['relocation'] = true;
      params['jobState'] = `%${jobState}%`;
      hasFilters = true;
    }

    // Apply filters if any exist, otherwise return all drivers
    if (hasFilters && conditions.length > 0) {
      query = query.andWhere(`(${conditions.join(' AND ')})`);
      if (Object.keys(params).length > 0) {
        query = query.setParameters(params);
      }
    }

    query = query.orderBy('driver.created_at', 'DESC');

    let [drivers, total] = await query.skip(skip).take(limit).getManyAndCount();

    // If we have fewer than requested limit, fetch more without filters to ensure minimum results
    if (drivers.length < Math.min(limit, 10)) {
      const allDriversQuery = this.driverProfileRepository.createQueryBuilder('driver')
        .orderBy('driver.created_at', 'DESC')
        .skip(skip)
        .take(limit);
      [drivers, total] = await allDriversQuery.getManyAndCount();
    }

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      drivers,
    };
  }
}
