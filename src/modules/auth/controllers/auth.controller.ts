import { _AUTH_COOKIE_NAME_, CookieOptions } from "@/constants";
import { extractUserForCookie } from "@/core/utils";
import type { UserRequest } from "@/definitions";
import { JoiValidationPipe } from "@/pipes/joi.validation.pipe";
import {
  Body,
  Controller,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import type { Response } from "express";
import {
  CreateAccountDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
} from "../dto";
import { AuthService } from "../services/auth.service";
import { UserLoginGuard } from "../user-guards";
import {
  CreateAccountValidation,
  ForgotPasswordValidation,
  LoginValidation,
  ResetPasswordValidation,
} from "../validations";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UsePipes(new JoiValidationPipe(LoginValidation))
  @UseGuards(UserLoginGuard)
  @Post("login")
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: UserRequest,
    @Res({ passthrough: true }) res: Response
  ) {
    res.clearCookie(_AUTH_COOKIE_NAME_);

    const { token, user } = await this.authService.login(
      loginDto,
      req
    );

    if (!token || !user ) {
      res.status(HttpStatus.NOT_ACCEPTABLE).json({
        success: false,
        message: "Authentication failed, please try again",
      });
    }
    const cookieData = { token, user: extractUserForCookie(user) };
    res.cookie(
      _AUTH_COOKIE_NAME_,
      encodeURIComponent(JSON.stringify(cookieData)),
      CookieOptions
    );

    return {
      data: {
        user,
        token
      },
    };
  }

  @UsePipes(new JoiValidationPipe(CreateAccountValidation))
  @Post("create-account")
  async createAccount(
    @Body() createAccountDto: CreateAccountDto,
    @Res({ passthrough: true }) res: Response
  ) {
    res.clearCookie(_AUTH_COOKIE_NAME_);

    const { data, message } =
      await this.authService.createAccount(createAccountDto);
    const { user, token } = data;

    if (!token || !user) {
      res.status(HttpStatus.NOT_ACCEPTABLE).json({
        success: false,
        message: "Authentication failed, please login to continue",
      });
    }

    const cookieData = { token, staff: extractUserForCookie(user) };
    res.cookie(
      _AUTH_COOKIE_NAME_,
      encodeURIComponent(JSON.stringify(cookieData)),
      CookieOptions
    );

    return {
      message,
      data: data,
    };
  }

  @Post("forgot-password")
  @UsePipes(new JoiValidationPipe(ForgotPasswordValidation))
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post("resend-forgot-password")
  @UsePipes(new JoiValidationPipe(ForgotPasswordValidation))
  async resendForgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto, true);
  }

  @Post("reset-password")
  @UsePipes(new JoiValidationPipe(ResetPasswordValidation))
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }
}
