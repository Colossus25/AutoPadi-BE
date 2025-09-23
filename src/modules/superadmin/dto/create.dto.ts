import { ApiProperty } from "@nestjs/swagger";

export class CreateAdminDto {

    @ApiProperty({ example: 'John'})
    first_name: string

    @ApiProperty({ example: 'Smith'})
    last_name: string

    @ApiProperty({ example: 'johnsmith@address.com' })
    email: string

    @ApiProperty({ example: 'password1234'})
    password: string

    @ApiProperty({ example: [1, 2]})
    super_group_ids?: number[]

    @ApiProperty({ example: [1, 2]})
    super_role_ids?: number[]
}