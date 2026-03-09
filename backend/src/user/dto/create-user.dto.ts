import { IsEmail, IsNotEmpty, IsEnum, MinLength, IsString, IsOptional } from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ example: 'admin@smartwms.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'Administrator' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ example: 'password123' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({ enum: Role, example: Role.STAFF })
    @IsEnum(Role)
    role: Role;
}
