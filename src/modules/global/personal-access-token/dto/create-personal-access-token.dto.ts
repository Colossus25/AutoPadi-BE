import { PersonalAccessTokenType } from '../entities/personal-access-token.entity';

export class CreatePersonalAccessTokenDto {
  token: string;
  user_id: number;
  token_type?: PersonalAccessTokenType;
}
