import { successResponse } from "@/core/utils";
import { JoiValidationPipe } from "@/pipes/joi.validation.pipe";
import { CacheInterceptor } from "@nestjs/cache-manager";
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseInterceptors,
  UsePipes,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { SkipThrottle } from "@nestjs/throttler";
import { Response } from "express";
import { ConfirmUserEmailDto } from "./dto";
import { PublicService } from "./public.service";
import {
  ConfirmUserEmailValidation,
} from "./validations";

@ApiTags("Public")
@Controller()
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  // Liveness only. Deliberately does not touch Postgres: a Supabase blip should
  // not make Render tear down and replace a healthy process.
  @SkipThrottle()
  @Get("health")
  health() {
    return { status: "ok" };
  }

  @UsePipes(new JoiValidationPipe(ConfirmUserEmailValidation))
  @Post("user/verify-email")
  async confirmEmailVerification(
    @Body() confirmUserEmailDto: ConfirmUserEmailDto,
    @Res() res: Response
  ) {
    const response =
      await this.publicService.confirmUserEmail(confirmUserEmailDto);
    successResponse(res, response);
  }
}
