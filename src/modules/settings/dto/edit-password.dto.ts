import { ApiProperty } from '@nestjs/swagger';


export class EditPasswordDto {
    @ApiProperty({ example: 'password1234' })
    currentPassword: string;

    @ApiProperty({ example: 'password1234' })
    newPassword: string;
}