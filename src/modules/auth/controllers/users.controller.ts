import { _AUTH_COOKIE_NAME_ } from "@/constants";
import { SystemCache, UserRequest } from "@/definitions";
import { AuthGuard } from "@/guards";
// import { CacheService } from "@/modules/global/cache-container/cache-container.service";
import { JoiValidationPipe } from "@/pipes/joi.validation.pipe";
import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { ChangeUserPasswordDto } from "../dto";
import {
  ChangeUserPasswordValidation,
  EditUserValidation,
} from "../validations";

@ApiCookieAuth(_AUTH_COOKIE_NAME_)
@UseGuards(AuthGuard)
@ApiTags("User")
@Controller("user")
export class UsersController {
  constructor(
    // private readonly cacheService: CacheService
  ) {}

  @Delete("logout")
  async logout(@Req() req: UserRequest, @Res() res: Response) {
    //Clear cache
    Object.keys(SystemCache).forEach((key) => {
      // this.cacheService.del(`${SystemCache[key]}_${req.user.id}`);
    });

    res.clearCookie(_AUTH_COOKIE_NAME_);
    res.json({
      success: true,
      message: "You have been logged out of this session",
    });
  }
}
