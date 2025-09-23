import { ApiProperty } from '@nestjs/swagger';

export class EditFullnameDto {
    @ApiProperty({ example: 'John' })
    firstName: string;

    @ApiProperty({ example: 'Smith' })
    lastName: string;
}