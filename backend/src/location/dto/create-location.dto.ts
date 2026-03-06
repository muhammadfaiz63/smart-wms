import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLocationDto {
    @IsNotEmpty()
    @IsString()
    bin_code: string;

    @IsNotEmpty()
    @IsString()
    zone: string;
}
