import { Body, Controller, Post, Get, Param, Patch, Delete, UseGuards, UsePipes, Req, Res, HttpStatus, Query } from '@nestjs/common';
import { DriverProfileService } from '../service/driver-profile.service';
import { CreateDriverProfileDto } from '../dto/create-driver-profile.dto';
import { JoiValidationPipe } from '@/pipes/joi.validation.pipe';
import { AuthGuard } from '@/guards';
import { UserRequest } from '@/definitions';
import { Response } from 'express';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { createDriverProfileValidation } from '../validations/driver-profile.validation';
import { _AUTH_COOKIE_NAME_ } from '@/constants';
import { PaginationDto } from '@/modules/global/common/dto/pagination.dto';

@ApiCookieAuth(_AUTH_COOKIE_NAME_)
@UseGuards(AuthGuard)
@ApiTags('Driver - Profile')
@Controller('driver/profile')
export class DriverProfileController {
  constructor(private readonly driverProfileService: DriverProfileService) {}

  @Post()
  @UsePipes(new JoiValidationPipe(createDriverProfileValidation))
  async createDriverProfile(@Body() dto: CreateDriverProfileDto, @Req() req: UserRequest, @Res() res: Response) {
    const driverProfile = await this.driverProfileService.createDriverProfile(dto, req.user);
    return res.status(HttpStatus.CREATED).json({ success: true, data: driverProfile });
  }

  @Get()
  async getAllDriverProfiles(@Req() req: UserRequest, @Res() res: Response, @Query() pagination: PaginationDto) {
    const driverProfiles = await this.driverProfileService.getAllDriverProfiles(req.user, pagination);
    return res.status(HttpStatus.OK).json({ success: true, data: driverProfiles });
  }

  @Get(':id')
  async getDriverProfile(@Param('id') id: number, @Req() req: UserRequest, @Res() res: Response) {
    const driverProfile = await this.driverProfileService.getDriverProfileById(id, req.user);
    return res.status(HttpStatus.OK).json({ success: true, data: driverProfile });
  }

  @Patch(':id')
  @UsePipes(new JoiValidationPipe(createDriverProfileValidation))
  async updateDriverProfile(
    @Param('id') id: number,
    @Body() dto: CreateDriverProfileDto,
    @Req() req: UserRequest,
    @Res() res: Response
  ) {
    const updatedDriverProfile = await this.driverProfileService.updateDriverProfile(id, dto, req.user);
    return res.status(HttpStatus.OK).json({
      success: true,
      data: updatedDriverProfile,
    });
  }

  @Delete(':id')
  async deleteDriverProfile(@Param('id') id: number, @Req() req: UserRequest, @Res() res: Response) {
    const result = await this.driverProfileService.deleteDriverProfile(id, req.user);
    return res.status(HttpStatus.OK).json({ success: true, ...result });
  }
}
