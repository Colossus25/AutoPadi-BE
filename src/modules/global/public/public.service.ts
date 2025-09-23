import { appConfig } from "@/config";
import { MAILJETTemplates } from "@/constants";
import { capitalizeString } from "@/core/helpers";
import { EmailService } from "@/core/utils";
import { User } from "@/modules/auth/entities/user.entity";
import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfirmUserEmailDto } from "./dto";

@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async confirmUserEmail(confirmUserEmailDto: ConfirmUserEmailDto) {
    const { email, token: remember_token } = confirmUserEmailDto;

    const user = await this.userRepository.findOneBy({ remember_token, email });
    if (!user)
      throw new BadRequestException(
        "This auth code has expired, please request for another one."
      );

    this.userRepository.update(
      { id: user.id },
      { email_verified_at: new Date().toISOString(), remember_token: null }
    );

    await new EmailService(
      { email },
      remember_token,
    ).verifyEmailSuccessEmail();

    return { message: "Email verification successful" };
  }
}
