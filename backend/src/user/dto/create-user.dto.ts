import { IsEmail, IsNotEmpty, IsEnum, MinLength } from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ example: 'staff3@smartwms.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'securepassword123' })
    @IsNotEmpty()
    @MinLength(6)
    password: string;

    @ApiProperty({ enum: Role, example: Role.STAFF })
    @IsEnum(Role)
    role: Role;
}
