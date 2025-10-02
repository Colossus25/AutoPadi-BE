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
  EmailService,
} from "@/core/utils";
import { type UserRequest } from "@/definitions";
import { BaseService } from "@/modules/base.service";
import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import {
  CreateAccountDto,
  ForgotPasswordDto,
  LoginDto,
  ResetPasswordDto,
} from "../dto";
import { CacheService } from "@/modules/global/cache-container/cache-container.service";
import { User, UserType } from "../entities/user.entity";

@Injectable()
export class AuthService extends BaseService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly cacheService: CacheService,
  ) {
    super();
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
    const token = this.jwtService.sign({ ...user });

    return { user, token };
  }

  async createAccount(createAccountDto: CreateAccountDto, userType: UserType) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    await queryRunner.startTransaction();
    try {
      const { email } = createAccountDto;

      const existingUser = await this.userRepository.exists({
        where: { email },
      });
      if (existingUser) {
        throw new UnprocessableEntityException("Validation failed", {
          cause: [
            { name: "email", message: "User with this email already exist." },
          ],
        });
      }

      const rememberToken = generateNumericCode();
      const user = await queryRunner.manager.save(User, {
        email: email.toLowerCase(),
        password: hashResourceSync(createAccountDto.password),
        user_type: userType,
        remember_token: rememberToken,
      });

      await queryRunner.commitTransaction();

      const token = this.jwtService.sign({ ...user });

      const userData = {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        user_type: user.user_type,
        phone: user.phone,
        address: user.address,
        landmark: user.landmark,
        city: user.city,
        state: user.state,
        profile_picture: user.profile_picture,
        remember_token: user.remember_token,
      };

      await new EmailService(
        { email },
        rememberToken,
      ).sendWelcomeEmail();

      await new EmailService(
        { email },
        rememberToken,
      ).sendVerifyEmail();

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

    //Check if sent less than 5mins ago
    if (await this.cacheService.get(`${user.email}_forgot_password`))
      throw new BadRequestException(
        "Please wait for about 5 minutes to request for another code."
      );

    const remember_token = generateNumericCode();
    this.userRepository.update({ email }, { remember_token });

    await new EmailService(
      { email },
      remember_token,
    ).sendPasswordResetEmail();

    //Save in redis
    this.cacheService.set(
      `${user.email}_forgot_password`,
      remember_token,
      _THROTTLE_TTL_
    );

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
    return { message: "Password reset." };
  }
}
