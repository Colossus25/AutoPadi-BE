import { Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PersonalAccessToken } from "../global/personal-access-token/entities/personal-access-token.entity";
import { PersonalAccessTokenService } from "../global/personal-access-token/personal-access-token.service";
import {
  AuthController,
  UsersController,
} from "./controllers";
import { User } from "./entities/user.entity";
import { AuthService } from "./services/auth.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      PersonalAccessToken,
    ]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [AuthController, UsersController],
  providers: [
    AuthService,
    PersonalAccessTokenService,
  ],
})
export class AuthModule {}
