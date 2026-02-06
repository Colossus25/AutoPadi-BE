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
  Query
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
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
  UserTypeValidation,
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

    const { message, user, token, } = await this.authService.login(
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
      message,
      data: {
        user,
        token,
      },
    };
  }

  @UsePipes(new JoiValidationPipe(CreateAccountValidation))
  @Post("create-account")
  @ApiQuery({
    name: "userType",
    enum: ["buyer", "auto dealer", "service provider", "driver", "driver employer"],
    required: true,
  })
  async createAccount(
    @Body() createAccountDto: CreateAccountDto,
    @Query(new JoiValidationPipe(UserTypeValidation)) query: { userType: string },
    @Res({ passthrough: true }) res: Response
  ) {
    const { userType } = query;
    res.clearCookie(_AUTH_COOKIE_NAME_);

    const { message, data } = await this.authService.createAccount(createAccountDto, userType);
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

  @Post("resend-welcome-email")
  @UsePipes(new JoiValidationPipe(ForgotPasswordValidation))
  async resendWelcomeEmail(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.resendWelcomeEmail(forgotPasswordDto);
  }

  @Post("resend-verify-email")
  @UsePipes(new JoiValidationPipe(ForgotPasswordValidation))
  async resendVerifyEmail(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.resendVerifyEmail(forgotPasswordDto);
  }
}
