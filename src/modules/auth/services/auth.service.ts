import { appConfig } from "@/config";
import { _THROTTLE_TTL_, MAILJETTemplates } from "@/constants";
import {
  generateNumericCode,
} from "@/core/helpers";
import {
  getUserCookieData,
  hashResource,
  hashResourceSync,
  verifyHash,
  getGoogleAuthUrl,
  exchangeGoogleCode,
  EmailService,
  type GoogleProfile,
} from "@/core/utils";
import { type UserRequest } from "@/definitions";
import { BaseService } from "@/modules/base.service";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotAcceptableException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { NotificationEvent } from "@/modules/notifications/notification-events";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import {
  CreateAccountDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
} from "../dto";
// import { CacheService } from "@/modules/global/cache-container/cache-container.service";
import { User } from "../entities/user.entity";
import { UserRole } from "../entities/user-role.entity";

@Injectable()
export class AuthService extends BaseService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    // private readonly cacheService: CacheService,
  ) {
    super();
  }

  private readonly logger = new Logger(AuthService.name);

  // The JWT lives inside the auth cookie, and nginx rejects any upstream
  // response whose header block exceeds its proxy buffer ("upstream sent too
  // big header" -> 502). The large `text` columns (document/photo URLs) have no
  // business in a token, so strip them before signing. Anything that needs them
  // re-fetches the user by id.
  private signUserToken<T extends object>(payload: T): string {
    const claims = { ...payload } as Record<string, unknown>;
    delete claims.id_image;
    delete claims.proof_of_address_image;
    delete claims.profile_picture;
    delete claims.password;
    return this.jwtService.sign(claims);
  }

  async login(loginDto: LoginDto, req: UserRequest) {
    const { user } = req;
    const verified = await verifyHash(loginDto.password, user.password);
    if (!verified)
      throw new NotAcceptableException(
        "Incorrect details given, please try again."
      );

    delete user.password;
    let userData = getUserCookieData(user.email, req);

    if (userData) userData = user;

    const roles = await this.listRoles(user.id);
    const userWithRoles = { ...user, roles };
    const token = this.signUserToken(userWithRoles);

    return { message: "Login successful.", user: userWithRoles, token };
  }

  async createAccount(createAccountDto: CreateAccountDto, userType: string) {
    const { email, password } = createAccountDto;
    const normalizedEmail = email.toLowerCase();

    // Existing identity → add the requested role to the same account (after
    // verifying the password) instead of rejecting the email as a duplicate.
    const existingUser = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .leftJoinAndSelect("user.roles", "roles")
      .where("user.email = :email", { email: normalizedEmail })
      .getOne();

    if (existingUser) {
      const verified = await verifyHash(password, existingUser.password);
      if (!verified)
        throw new UnauthorizedException(
          "An account with this email already exists. Please log in to add this role."
        );

      const alreadyHasRole = existingUser.roles?.some(
        (role) => role.user_type === userType
      );
      if (alreadyHasRole)
        throw new ConflictException(`You already have a ${userType} account.`);

      await this.userRoleRepository.save({
        user_id: existingUser.id,
        user_type: userType,
      });

      // Make the newly added role the active one.
      await this.userRepository.update(
        { id: existingUser.id },
        { user_type: userType }
      );

      delete existingUser.password;
      const roles = Array.from(
        new Set([
          ...(existingUser.roles?.map((role) => role.user_type) ?? []),
          userType,
        ])
      );
      const user = { ...existingUser, user_type: userType, roles };
      const token = this.signUserToken(user);

      return {
        message: `Your ${userType} account has been added.`,
        data: { user, token },
      };
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    await queryRunner.startTransaction();
    try {
      const rememberToken = generateNumericCode();
      const user = await queryRunner.manager.save(User, {
        email: normalizedEmail,
        password: hashResourceSync(password),
        user_type: userType,
        provider: "local",
        remember_token: rememberToken,
      });

      await queryRunner.manager.save(UserRole, {
        user_id: user.id,
        user_type: userType,
      });

      await queryRunner.commitTransaction();

      const roles = [userType];
      const token = this.signUserToken({ ...user, roles });

      const userData = {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        user_type: user.user_type,
        phone: user.phone,
        id_type: user.id_type,
        id_number: user.id_number,
        id_image: user.id_image,
        address: user.address,
        landmark: user.landmark,
        city: user.city,
        state: user.state,
        proof_of_address_image: user.proof_of_address_image,
        profile_picture: user.profile_picture,
        provider: user.provider,
        remember_token: user.remember_token,
        roles,
      };

      // Fire-and-forget: broken/slow SMTP must never block or fail signup. If
      // the verify code doesn't arrive it can be re-sent via
      // /auth/resend-verify-email.
      new EmailService({ email }, rememberToken)
        .sendWelcomeEmail()
        .catch((e) =>
          this.logger.error(`Welcome email failed for ${email}: ${e?.message ?? e}`)
        );
      new EmailService({ email }, rememberToken)
        .sendVerifyEmail()
        .catch((e) =>
          this.logger.error(`Verify email failed for ${email}: ${e?.message ?? e}`)
        );

      const data = {
        user: userData,
        token,
      };

      return { message: "Account creation successful.", data };
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async forgotPassword({ email }: ForgotPasswordDto, resend = false) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user)
      throw new NotAcceptableException(
        "Email provided is not recognized, please try again."
      );

    // //Check if sent less than 5mins ago
    // if (await this.cacheService.get(`${user.email}_forgot_password`))
    //   throw new BadRequestException(
    //     "Please wait for about 5 minutes to request for another code."
    //   );

    const remember_token = generateNumericCode();
    this.userRepository.update({ email }, { remember_token });

    await new EmailService(
      { email },
      remember_token,
    ).sendPasswordResetEmail();

    // //Save in redis
    // this.cacheService.set(
    //   `${user.email}_forgot_password`,
    //   remember_token,
    //   _THROTTLE_TTL_
    // );

    return {
      message: resend
        ? "Check your email account for the password reset token. Please check your spam if not received on time."
        : "Check your email account for the password reset token.",
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { password, token } = resetPasswordDto;

    const user = await this.userRepository.findOneBy({ remember_token: token });
    if (!user)
      throw new NotAcceptableException(
        "Your auth code has expired, please request for another one."
      );

    await this.userRepository.update(
      { id: user.id },
      { password: await hashResource(password) }
    );
    const { email, id } = user;

    let remember_token = '';

    await new EmailService(
      { email },
      remember_token,
    ).sendPasswordResetSuccessEmail();

    this.userRepository.update({ id }, { remember_token: null });

    this.eventEmitter.emit(NotificationEvent.PASSWORD_CHANGED, { userId: id });

    return { message: "Password reset." };
  }

  async resendWelcomeEmail({ email }: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user)
      throw new NotAcceptableException(
        "Email provided is not recognized, please try again."
      );

    const remember_token = user.remember_token || generateNumericCode();
    
    if (!user.remember_token) {
      await this.userRepository.update({ email }, { remember_token });
    }

    await new EmailService(
      { email },
      remember_token,
    ).sendWelcomeEmail();

    return {
      message: "Welcome email has been resent. Please check your inbox.",
    };
  }

  async resendVerifyEmail({ email }: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user)
      throw new NotAcceptableException(
        "Email provided is not recognized, please try again."
      );

    const remember_token = user.remember_token || generateNumericCode();
    
    if (!user.remember_token) {
      await this.userRepository.update({ email }, { remember_token });
    }

    await new EmailService(
      { email },
      remember_token,
    ).sendVerifyEmail();

    return {
      message: "Verification email has been resent. Please check your inbox.",
    };
  }

  private async listRoles(userId: number): Promise<string[]> {
    const roles = await this.userRoleRepository.find({
      where: { user_id: userId },
      order: { created_at: "ASC" },
    });
    return roles.map((role) => role.user_type);
  }

  // Adds a role to the logged-in user's account (in-app "become a X" upgrade).
  async addRole(userId: number, userType: string) {
    const existing = await this.userRoleRepository.findOne({
      where: { user_id: userId, user_type: userType },
    });
    if (existing)
      throw new ConflictException(`You already have a ${userType} account.`);

    await this.userRoleRepository.save({ user_id: userId, user_type: userType });

    const user = await this.userRepository.findOne({ where: { id: userId } });
    const roles = await this.listRoles(userId);
    const userWithRoles = { ...user, roles };
    const token = this.signUserToken(userWithRoles);

    return {
      message: `Your ${userType} account has been added.`,
      data: { user: userWithRoles, token, roles },
    };
  }

  // Sets the active role (user_type) and re-issues a token for that context.
  async switchRole(userId: number, userType: string) {
    const role = await this.userRoleRepository.findOne({
      where: { user_id: userId, user_type: userType },
    });
    if (!role)
      throw new ForbiddenException(
        `You don't have a ${userType} account. Add it first.`
      );

    await this.userRepository.update({ id: userId }, { user_type: userType });

    const user = await this.userRepository.findOne({ where: { id: userId } });
    const roles = await this.listRoles(userId);
    const userWithRoles = { ...user, roles };
    const token = this.signUserToken(userWithRoles);

    return {
      message: `Switched to your ${userType} account.`,
      data: { user: userWithRoles, token },
    };
  }

  // Find-or-create the identity from a verified Google profile, then
  // ensure/activate the requested role. userType defaults to "buyer" for
  // brand-new accounts. Returns the same shape as login.
  async googleAuth(profile: GoogleProfile, userType?: string) {
    if (!profile.email_verified)
      throw new UnauthorizedException(
        "Your Google email is not verified, please use a verified Google account."
      );

    const email = profile.email.toLowerCase();

    const existingUser = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.roles", "roles")
      .where("user.email = :email", { email })
      .getOne();

    // New identity → create the account + its first role transactionally.
    if (!existingUser) {
      const role = userType ?? "buyer";
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      let user: User;
      try {
        user = await queryRunner.manager.save(User, {
          email,
          first_name: profile.given_name,
          last_name: profile.family_name,
          profile_picture: profile.picture ?? null,
          provider: "google",
          google_id: profile.sub,
          user_type: role,
          email_verified_at: new Date(),
          password: null,
        });
        await queryRunner.manager.save(UserRole, {
          user_id: user.id,
          user_type: role,
        });
        await queryRunner.commitTransaction();
      } catch (error) {
        if (queryRunner.isTransactionActive) {
          await queryRunner.rollbackTransaction();
        }
        throw error;
      } finally {
        await queryRunner.release();
      }

      // Fire-and-forget: a slow or broken SMTP must never block the sign-in
      // redirect (the account is already created and committed above).
      new EmailService({ email }, "")
        .sendWelcomeEmail()
        .catch((e) =>
          this.logger.error(
            `Google created account welcome email failed for ${email}: ${e?.message ?? e}`
          )
        );

      const roles = [role];
      const userWithRoles = { ...user, password: undefined, roles };
      const token = this.signUserToken(userWithRoles);

      return {
        message: "Account created with Google.",
        data: { user: userWithRoles, token },
      };
    }

    // Existing identity → link Google, ensure the role, activate it, log in.
    const updates: Partial<User> = {};
    if (!existingUser.google_id) {
      updates.google_id = profile.sub;
      if (!existingUser.provider) updates.provider = "google";
    }
    if (!existingUser.email_verified_at) updates.email_verified_at = new Date();
    if (!existingUser.profile_picture && profile.picture)
      updates.profile_picture = profile.picture;

    let roles = existingUser.roles?.map((role) => role.user_type) ?? [];

    if (userType) {
      if (!roles.includes(userType)) {
        await this.userRoleRepository.save({
          user_id: existingUser.id,
          user_type: userType,
        });
        roles = [...roles, userType];
      }
      updates.user_type = userType; // activate the requested role
    }

    if (Object.keys(updates).length)
      await this.userRepository.update({ id: existingUser.id }, updates);

    const userWithRoles = {
      ...existingUser,
      ...updates,
      password: undefined,
      roles,
    };
    const token = this.signUserToken(userWithRoles);

    return {
      message: "Login successful.",
      data: { user: userWithRoles, token },
    };
  }

  private readonly googleUserTypes = [
    "buyer",
    "auto dealer",
    "service provider",
    "driver",
    "driver employer",
  ];

  // Step 1: build the Google consent URL. The chosen role is carried through a
  // signed, short-lived `state` (also our CSRF protection).
  buildGoogleAuthUrl(userType?: string): string {
    if (userType && !this.googleUserTypes.includes(userType))
      throw new BadRequestException("Invalid user type.");

    const state = this.jwtService.sign(
      { typ: "oauth_state", userType: userType ?? null },
      { expiresIn: "10m" }
    );
    return getGoogleAuthUrl(state);
  }

  // Step 2: Google redirects back here. Verify state, exchange the code,
  // find-or-create the user, and return the app deep link carrying the JWT.
  async handleGoogleCallback(params: {
    code?: string;
    state?: string;
    error?: string;
  }): Promise<string> {
    try {
      if (!params.state) throw new UnauthorizedException("Missing state.");

      let decoded: { typ?: string; userType?: string | null };
      try {
        decoded = this.jwtService.verify(params.state);
      } catch {
        throw new UnauthorizedException("Invalid or expired sign-in state.");
      }
      if (decoded?.typ !== "oauth_state")
        throw new UnauthorizedException("Invalid sign-in state.");

      if (params.error) throw new UnauthorizedException(params.error);
      if (!params.code)
        throw new UnauthorizedException("Missing authorization code.");

      const profile = await exchangeGoogleCode(params.code);
      const { data } = await this.googleAuth(
        profile,
        decoded.userType ?? undefined
      );
      return this.buildGoogleClientRedirect({ token: data.token });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Google sign-in failed.";
      this.logger.error(
        `Google callback failed: ${message}`,
        err instanceof Error ? err.stack : undefined
      );
      return this.buildGoogleClientRedirect({ error: message });
    }
  }

  private buildGoogleClientRedirect(params: {
    token?: string;
    error?: string;
  }): string {
    const base = appConfig.GOOGLE_MOBILE_REDIRECT;
    if (!base)
      throw new ServiceUnavailableException(
        "App redirect URL (GOOGLE_MOBILE_REDIRECT) is not configured."
      );

    const sep = base.includes("?") ? "&" : "?";
    const query = params.token
      ? `token=${encodeURIComponent(params.token)}`
      : `error=${encodeURIComponent(params.error ?? "google_signin_failed")}`;
    return `${base}${sep}${query}`;
  }
}
