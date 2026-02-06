import { Body, Controller, Post, Get, Param, Patch, Delete, UseGuards, UsePipes, Req, Res, HttpStatus, Query } from '@nestjs/common';
import { DriverJobService } from '../service/driver-job.service';
import { CreateDriverJobDto } from '../dto/create-driver-job.dto';
import { JoiValidationPipe } from '@/pipes/joi.validation.pipe';
import { AuthGuard } from '@/guards';
import { UserRequest } from '@/definitions';
import { Response } from 'express';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { createDriverJobValidation } from '../validations/driver-job.validation';
import { _AUTH_COOKIE_NAME_ } from '@/constants';
import { PaginationDto } from '@/modules/global/common/dto/pagination.dto';

@ApiCookieAuth(_AUTH_COOKIE_NAME_)
@UseGuards(AuthGuard)
@ApiTags('Driver Employer - Jobs')
@Controller('driver-employer/job')
export class DriverJobController {
  constructor(private readonly driverJobService: DriverJobService) {}

  @Post()
  @UsePipes(new JoiValidationPipe(createDriverJobValidation))
  async createDriverJob(@Body() dto: CreateDriverJobDto, @Req() req: UserRequest, @Res() res: Response) {
    const driverJob = await this.driverJobService.createDriverJob(dto, req.user);
    return res.status(HttpStatus.CREATED).json({ success: true, data: driverJob });
  }

  @Get()
  async getAllDriverJobs(@Req() req: UserRequest, @Res() res: Response, @Query() pagination: PaginationDto) {
    const driverJobs = await this.driverJobService.getAllDriverJobs(req.user, pagination);
    return res.status(HttpStatus.OK).json({ success: true, data: driverJobs });
  }

  @Get(':id')
  async getDriverJob(@Param('id') id: number, @Req() req: UserRequest, @Res() res: Response) {
    const driverJob = await this.driverJobService.getDriverJobById(id, req.user);
    return res.status(HttpStatus.OK).json({ success: true, data: driverJob });
  }

  @Patch(':id')
  @UsePipes(new JoiValidationPipe(createDriverJobValidation))
  async updateDriverJob(
    @Param('id') id: number,
    @Body() dto: CreateDriverJobDto,
    @Req() req: UserRequest,
    @Res() res: Response
  ) {
    const updatedDriverJob = await this.driverJobService.updateDriverJob(id, dto, req.user);
    return res.status(HttpStatus.OK).json({
      success: true,
      data: updatedDriverJob,
    });
  }

  @Delete(':id')
  async deleteDriverJob(@Param('id') id: number, @Req() req: UserRequest, @Res() res: Response) {
    const result = await this.driverJobService.deleteDriverJob(id, req.user);
    return res.status(HttpStatus.OK).json({ success: true, ...result });
  }
}
