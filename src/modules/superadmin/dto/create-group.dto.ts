import { ApiProperty } from "@nestjs/swagger";

export class CreateGroupDto {
    @ApiProperty({ example: "IT Department"})
    name: string

    @ApiProperty({ example: "This is the IT Group"})
    description?: string

    @ApiProperty({ example: 2})
    parent_id?: number
}