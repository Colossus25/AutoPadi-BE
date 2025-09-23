import { ApiProperty } from '@nestjs/swagger';


export class EditContactInfoDto {
    @ApiProperty({ example: 'johnsmith@address.com' })
    email: string;

    @ApiProperty({ example: '+234-987-6543-210' })
    phone: string;
}