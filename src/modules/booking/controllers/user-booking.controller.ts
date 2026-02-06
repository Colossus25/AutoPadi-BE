import { Body, Controller, Post, Get, Param, Delete, UseGuards, UsePipes, Req, Res, HttpStatus, Query } from '@nestjs/common';
import { BookingService } from '../services/booking.service';
import { CreateBookingDto, CreateReviewDto, CreateReportDto } from '../dto/booking.dto';
import { JoiValidationPipe } from '@/pipes/joi.validation.pipe';
import { AuthGuard } from '@/guards';
import { UserRequest } from '@/definitions';
import { Response } from 'express';
import { ApiTags, ApiCookieAuth } from '@nestjs/swagger';
import { createBookingValidation, createReviewValidation, createReportValidation } from '../validations/booking.validation';
import { _AUTH_COOKIE_NAME_ } from '@/constants';
import { PaginationDto } from '@/modules/global/common/dto/pagination.dto';

@ApiCookieAuth(_AUTH_COOKIE_NAME_)
@UseGuards(AuthGuard)
@ApiTags('Booking - User')
@Controller('booking/user')
export class UserBookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('create')
  @UsePipes(new JoiValidationPipe(createBookingValidation))
  async createBooking(@Body() dto: CreateBookingDto, @Req() req: UserRequest, @Res() res: Response) {
    const booking = await this.bookingService.createBooking(dto, req.user);
    return res.status(HttpStatus.CREATED).json({ success: true, data: booking });
  }

  @Get('bookings')
  async getUserBookings(@Req() req: UserRequest, @Res() res: Response, @Query() pagination: PaginationDto, @Query('status') status?: string) {
    const bookings = await this.bookingService.getUserBookings(req.user, pagination, status);
    return res.status(HttpStatus.OK).json({ success: true, data: bookings });
  }

  @Get('bookings/:id')
  async getBooking(@Param('id') id: number, @Req() req: UserRequest, @Res() res: Response) {
    const booking = await this.bookingService.getBookingById(id);
    return res.status(HttpStatus.OK).json({ success: true, data: booking });
  }

  @Post('bookings/:id/cancel')
  async cancelBooking(@Param('id') id: number, @Body() body: { reason?: string }, @Req() req: UserRequest, @Res() res: Response) {
    const booking = await this.bookingService.cancelBooking(id, req.user, body.reason);
    return res.status(HttpStatus.OK).json({ success: true, data: booking });
  }

  @Post('bookings/:id/review')
  @UsePipes(new JoiValidationPipe(createReviewValidation))
  async addReview(@Param('id') id: number, @Body() dto: CreateReviewDto, @Req() req: UserRequest, @Res() res: Response) {
    const review = await this.bookingService.addReview(id, dto, req.user);
    return res.status(HttpStatus.CREATED).json({ success: true, data: review });
  }

  @Post('bookings/:id/report')
  @UsePipes(new JoiValidationPipe(createReportValidation))
  async addReport(@Param('id') id: number, @Body() dto: CreateReportDto, @Req() req: UserRequest, @Res() res: Response) {
    const report = await this.bookingService.addReport(id, dto, req.user);
    return res.status(HttpStatus.CREATED).json({ success: true, data: report });
  }
}
