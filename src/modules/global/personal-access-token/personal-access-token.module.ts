import { PersonalAccessToken } from '@/modules/global/personal-access-token/entities/personal-access-token.entity';
import { User } from '@/modules/auth/entities/user.entity';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonalAccessTokenService } from './personal-access-token.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User, PersonalAccessToken])],
  providers: [PersonalAccessTokenService],
  exports: [PersonalAccessTokenService],
})
export class PersonalAccessTokenModule {}
