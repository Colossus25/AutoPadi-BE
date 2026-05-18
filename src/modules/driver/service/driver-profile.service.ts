import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverProfile } from '../entities/driver-profile.entity';
import { DriverJob } from '@/modules/driver-employer/entities/driver-job.entity';
import { CreateDriverProfileDto } from '../dto/create-driver-profile.dto';
import { User } from '@/modules/auth/entities/user.entity';
import { PaginationDto } from '@/modules/global/common/dto/pagination.dto';
import { AnalyticsService } from '@/modules/analytics/services/analytics.service';
import {
  AnalyticsEventType,
  AnalyticsResourceType,
} from '@/modules/analytics/entities/analytics-event.entity';

@Injectable()
export class DriverProfileService {
  constructor(
    @InjectRepository(DriverProfile)
    private readonly driverProfileRepository: Repository<DriverProfile>,
    @InjectRepository(DriverJob)
    private readonly driverJobRepository: Repository<DriverJob>,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async createDriverProfile(dto: CreateDriverProfileDto, user: User, userSubscription?: any) {
    if (user.user_type !== 'driver') {
      throw new ForbiddenException('Only drivers can create a driver profile');
    }
    const driverProfile = this.driverProfileRepository.create({
      ...dto,
      created_by: user,
      user_subscription: userSubscription || null,
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

    const total_matches = await this.countMatchedJobs(driverProfile);

    return {
      ...driverProfile,
      total_views: driverProfile.views_count,
      total_clicks: driverProfile.clicks_count,
      total_matches,
    };
  }

  async trackView(id: number, user: User) {
    const profile = await this.driverProfileRepository.findOne({ where: { id } });
    if (!profile) throw new NotFoundException('Driver profile not found');
    await this.driverProfileRepository.increment({ id }, 'views_count', 1);
    await this.analyticsService.logEvent({
      resource_type: AnalyticsResourceType.DRIVER,
      resource_id: id,
      event_type: AnalyticsEventType.VIEW,
      user_id: user.id,
    });
    return { id, views_count: profile.views_count + 1 };
  }

  async trackClick(id: number, user: User) {
    const profile = await this.driverProfileRepository.findOne({ where: { id } });
    if (!profile) throw new NotFoundException('Driver profile not found');
    await this.driverProfileRepository.increment({ id }, 'clicks_count', 1);
    await this.analyticsService.logEvent({
      resource_type: AnalyticsResourceType.DRIVER,
      resource_id: id,
      event_type: AnalyticsEventType.CLICK,
      user_id: user.id,
    });
    return { id, clicks_count: profile.clicks_count + 1 };
  }

  async getAnalytics(user: User) {
    const profiles = await this.driverProfileRepository.find({
      where: { created_by: { id: user.id } },
      select: ['id'],
    });
    const ids = profiles.map((p) => p.id);
    return this.analyticsService.getMonthlyStats(AnalyticsResourceType.DRIVER, ids);
  }

  /**
   * Count driver jobs that match this profile using the same soft-filter rules
   * as getMatchedJobs (without the minimum-results fallback), so the number
   * reflects a real match count.
   */
  async countMatchedJobs(profile: DriverProfile): Promise<number> {
    let query = this.driverJobRepository.createQueryBuilder('job');
    const conditions: string[] = [];
    const params: Record<string, any> = {};

    if (profile.type_of_vehicles && profile.type_of_vehicles.length > 0) {
      const vehicleConditions = profile.type_of_vehicles
        .map((_, idx) => `job.type_of_vehicles LIKE :vehicle${idx}`)
        .join(' OR ');
      conditions.push(`(${vehicleConditions})`);
      profile.type_of_vehicles.forEach((vehicle, idx) => {
        params[`vehicle${idx}`] = `%${vehicle}%`;
      });
    }

    if (profile.years_of_experience !== null && profile.years_of_experience !== undefined) {
      conditions.push('(job.driver_years_of_experience IS NULL OR job.driver_years_of_experience <= :driverExp)');
      params['driverExp'] = profile.years_of_experience;
    }

    if (profile.gender) {
      conditions.push('(job.driver_gender IS NULL OR job.driver_gender = :driverGender)');
      params['driverGender'] = profile.gender;
    }

    if (profile.valid_driver_license) {
      conditions.push('(job.valid_driver_license IS NULL OR job.valid_driver_license = :hasLicense)');
      params['hasLicense'] = true;
    }

    if (profile.level_of_education) {
      conditions.push('(job.driver_level_of_education IS NULL OR job.driver_level_of_education = :eduLevel)');
      params['eduLevel'] = profile.level_of_education;
    }

    if (conditions.length > 0) {
      query = query.where(conditions.join(' AND '), params);
    }

    return query.getCount();
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

  /**
   * Find matched jobs for a driver based on their profile
   * Matching criteria: vehicle types, experience, license, education, location preferences
   */
  async getMatchedJobs(user: User, pagination: PaginationDto) {
    if (user.user_type !== 'driver') {
      throw new ForbiddenException('Only drivers can view matched jobs');
    }

    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    // Get the driver's profile
    const driverProfile = await this.driverProfileRepository.findOne({
      where: { created_by: { id: user.id } },
    });

    if (!driverProfile) {
      throw new NotFoundException('Driver profile not found. Please create one first.');
    }

    // Start building query for jobs - will apply soft filters (suggestions, not requirements)
    let query = this.driverJobRepository.createQueryBuilder('job')
      .leftJoinAndSelect('job.created_by', 'created_by');
    let hasFilters = false;

    // Apply filters as soft suggestions (using OR logic to always return results)
    const conditions: string[] = [];
    const params: any = {};

    // Vehicle type match (soft preference)
    if (driverProfile.type_of_vehicles && driverProfile.type_of_vehicles.length > 0) {
      const vehicleConditions = driverProfile.type_of_vehicles
        .map((vehicle, idx) => `job.type_of_vehicles LIKE :vehicle${idx}`)
        .join(' OR ');
      conditions.push(`(${vehicleConditions})`);
      driverProfile.type_of_vehicles.forEach((vehicle, idx) => {
        params[`vehicle${idx}`] = `%${vehicle}%`;
      });
      hasFilters = true;
    }

    // Experience match (soft preference)
    if (driverProfile.years_of_experience !== null && driverProfile.years_of_experience !== undefined) {
      conditions.push('(job.driver_years_of_experience IS NULL OR job.driver_years_of_experience <= :driverExp)');
      params['driverExp'] = driverProfile.years_of_experience;
      hasFilters = true;
    }

    // Gender preference (soft match)
    if (driverProfile.gender) {
      conditions.push('(job.driver_gender IS NULL OR job.driver_gender = :driverGender)');
      params['driverGender'] = driverProfile.gender;
      hasFilters = true;
    }

    // License match (soft preference)
    if (driverProfile.valid_driver_license) {
      conditions.push('(job.valid_driver_license IS NULL OR job.valid_driver_license = :hasLicense)');
      params['hasLicense'] = true;
      hasFilters = true;
    }

    // Education match (soft preference)
    if (driverProfile.level_of_education) {
      conditions.push('(job.driver_level_of_education IS NULL OR job.driver_level_of_education = :eduLevel)');
      params['eduLevel'] = driverProfile.level_of_education;
      hasFilters = true;
    }

    // Apply filters if any exist, otherwise return all jobs
    if (hasFilters && conditions.length > 0) {
      query = query.andWhere(`(${conditions.join(' AND ')})`);
      if (Object.keys(params).length > 0) {
        query = query.setParameters(params);
      }
    }

    query = query.orderBy('job.created_at', 'DESC');

    let [jobs, total] = await query.skip(skip).take(limit).getManyAndCount();

    // If we have fewer than requested limit, fetch more without filters to ensure minimum results
    if (jobs.length < Math.min(limit, 10)) {
      const allJobsQuery = this.driverJobRepository.createQueryBuilder('job')
        .leftJoinAndSelect('job.created_by', 'created_by')
        .orderBy('job.created_at', 'DESC')
        .skip(skip)
        .take(limit);
      [jobs, total] = await allJobsQuery.getManyAndCount();
    }

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      jobs,
    };
  }
}
