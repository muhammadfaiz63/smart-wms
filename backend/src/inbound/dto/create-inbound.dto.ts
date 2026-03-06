import { IsNotEmpty, IsNumber, IsString, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInboundDto {
    @ApiProperty({ example: 1, description: 'ID of the product from master data' })
    @IsNotEmpty()
    @IsNumber()
    productId: number;

    @ApiProperty({ example: 1, description: 'ID of the location bin' })
    @IsNotEmpty()
    @IsNumber()
    locationId: number;

    @ApiProperty({ example: 100, description: 'Quantity of items to receive' })
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    qty: number;

    @ApiProperty({ example: 'BATCH-001', description: 'Production batch number' })
    @IsNotEmpty()
    @IsString()
    batchNo: string;

    @ApiProperty({ example: '2026-12-31', description: 'Expiration date (YYYY-MM-DD)', required: false })
    @IsOptional()
    @IsDateString()
    expiredAt?: string;
}
