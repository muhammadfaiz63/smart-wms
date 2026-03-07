import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOutboundDto {
    @ApiProperty({ example: 1, description: 'ID of the product to dispatch' })
    @IsNotEmpty()
    @IsNumber()
    productId: number;

    @ApiProperty({ example: 10, description: 'Quantity of items required' })
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    qty: number;
}
