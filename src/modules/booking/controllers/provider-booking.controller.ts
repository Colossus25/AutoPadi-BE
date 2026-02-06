import { Body, Controller, Get, Param, Patch, Post, UseGuards, UsePipes, Req, Res, HttpStatus, Query } from '@nestjs/common';
import { BookingService } from '../services/booking.service';
import { UpdateBookingStatusDto, CreateReportDto } from '../dto/booking.dto';
import { JoiValidationPipe } from '@/pipes/joi.validation.pipe';
import { AuthGuard } from '@/guards';
import { UserRequest } from '@/definitions';
import { Response } from 'express';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { updateBookingStatusValidation, createReportValidation } from '../validations/booking.validation';
import { _AUTH_COOKIE_NAME_ } from '@/constants';
import { PaginationDto } from '@/modules/global/common/dto/pagination.dto';

@ApiCookieAuth(_AUTH_COOKIE_NAME_)
@UseGuards(AuthGuard)
@ApiTags('Booking - Service Provider')
@Controller('booking/provider')
export class ProviderBookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('bookings')
  async getProviderBookings(@Req() req: UserRequest, @Res() res: Response, @Query() pagination: PaginationDto, @Query('status') status?: string) {
    const bookings = await this.bookingService.getServiceProviderBookings(req.user, pagination, status);
    return res.status(HttpStatus.OK).json({ success: true, data: bookings });
  }

  @Get('bookings/:id')
  async getBooking(@Param('id') id: number, @Req() req: UserRequest, @Res() res: Response) {
    const booking = await this.bookingService.getBookingById(id);
    return res.status(HttpStatus.OK).json({ success: true, data: booking });
  }

  @Patch('bookings/:id/status')
  @UsePipes(new JoiValidationPipe(updateBookingStatusValidation))
  async updateBookingStatus(@Param('id') id: number, @Body() dto: UpdateBookingStatusDto, @Req() req: UserRequest, @Res() res: Response) {
    const booking = await this.bookingService.updateBookingStatus(id, dto, req.user);
    return res.status(HttpStatus.OK).json({ success: true, data: booking });
  }

  @Post('bookings/:id/report')
  @UsePipes(new JoiValidationPipe(createReportValidation))
  async addReport(@Param('id') id: number, @Body() dto: CreateReportDto, @Req() req: UserRequest, @Res() res: Response) {
    const report = await this.bookingService.addReport(id, dto, req.user);
    return res.status(HttpStatus.CREATED).json({ success: true, data: report });
  }
}
