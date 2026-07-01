import { _AUTH_COOKIE_NAME_, CookieOptions } from "@/constants";
import { extractUserForCookie } from "@/core/utils";
import type { UserRequest } from "@/definitions";
import { JoiValidationPipe } from "@/pipes/joi.validation.pipe";
import {
  Body,
  Controller,
  Get,
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
  RoleDto,
} from "../dto";
import { AuthService } from "../services/auth.service";
import { UserLoginGuard } from "../user-guards";
import { AuthGuard } from "@/guards";
import {
  CreateAccountValidation,
  UserTypeValidation,
  ForgotPasswordValidation,
  LoginValidation,
  ResetPasswordValidation,
  RoleValidation,
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

    const cookieData = { token, user: extractUserForCookie(user) };
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

  // Step 1: kick off Google sign-in. The app opens this URL in a browser tab.
  // ?userType=<role> is optional (for signup).
  @Get("google")
  @ApiQuery({ name: "userType", required: false })
  googleStart(@Query("userType") userType: string, @Res() res: Response) {
    const url = this.authService.buildGoogleAuthUrl(userType);
    return res.redirect(url);
  }

  // Step 2: Google redirects here; we finish auth and redirect back to the
  // client (deep link for mobile, web URL for web) carrying ?token=<jwt>.
  @Get("google/callback")
  async googleCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Query("error") error: string,
    @Res() res: Response
  ) {
    const redirectUrl = await this.authService.handleGoogleCallback({
      code,
      state,
      error,
    });
    return res.redirect(redirectUrl);
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

  @Post("roles")
  @UseGuards(AuthGuard)
  @UsePipes(new JoiValidationPipe(RoleValidation))
  async addRole(@Body() body: RoleDto, @Req() req: UserRequest) {
    return await this.authService.addRole(req.user.id, body.userType);
  }

  @Post("switch-role")
  @UseGuards(AuthGuard)
  @UsePipes(new JoiValidationPipe(RoleValidation))
  async switchRole(
    @Body() body: RoleDto,
    @Req() req: UserRequest,
    @Res({ passthrough: true }) res: Response
  ) {
    res.clearCookie(_AUTH_COOKIE_NAME_);

    const { message, data } = await this.authService.switchRole(
      req.user.id,
      body.userType
    );
    const { user, token } = data;

    const cookieData = { token, user: extractUserForCookie(user) };
    res.cookie(
      _AUTH_COOKIE_NAME_,
      encodeURIComponent(JSON.stringify(cookieData)),
      CookieOptions
    );

    return { message, data };
  }
}
