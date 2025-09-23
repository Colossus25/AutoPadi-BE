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
