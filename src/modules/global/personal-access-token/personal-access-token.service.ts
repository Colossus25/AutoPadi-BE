import { dateHasExpired, getDateTime } from '@/core/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePersonalAccessTokenDto } from './dto/create-personal-access-token.dto';
import { PersonalAccessToken, PersonalAccessTokenType } from './entities/personal-access-token.entity';

@Injectable()
export class PersonalAccessTokenService {
  constructor(
    @InjectRepository(PersonalAccessToken)
    private readonly personalAccessTokenRepository: Repository<PersonalAccessToken>,
  ) {}

  async create(createPersonalAccessTokenDto: CreatePersonalAccessTokenDto, expiresIn = 30) {
    const { user_id: id, token_type } = createPersonalAccessTokenDto;

    await this.personalAccessTokenRepository.delete({ user: { id }, token_type });
    const due_at = getDateTime(expiresIn);

    const user = this.personalAccessTokenRepository.create({
      ...createPersonalAccessTokenDto,
      user: { id },
      due_at,
    });

    return await this.personalAccessTokenRepository.save(user);
  }

  async verify(token: string, token_type = PersonalAccessTokenType.otp) {
    const existingToken = await this.personalAccessTokenRepository.findOne({
      where: { token, token_type },
      relations: ['user'],
    });
    if (!existingToken) return false;

    if (existingToken.due_at && dateHasExpired(existingToken.due_at)) {
      await this.delete(token);
      return false;
    }

    return existingToken;
  }

  async check(token: string, token_type = PersonalAccessTokenType.otp) {
    const existingToken = await this.personalAccessTokenRepository.findOne({
      where: { token, token_type },
      relations: ['user'],
    });

    if (!existingToken) return null;

    if (existingToken.due_at && dateHasExpired(existingToken.due_at)) return null;

    return existingToken;
  }

  async getUserToken(userId: number, token_type = PersonalAccessTokenType.otp) {
    return await this.personalAccessTokenRepository.findOne({ where: { user: { id: userId }, token_type } });
  }

  async softDelete(token: string) {
    await this.personalAccessTokenRepository.softDelete({ token });
  }

  async delete(token: string) {
    await this.personalAccessTokenRepository.delete({ token });
  }
}
