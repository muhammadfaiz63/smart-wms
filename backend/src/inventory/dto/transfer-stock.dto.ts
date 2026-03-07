import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TransferStockDto {
    @ApiProperty({ example: 1, description: 'ID of the product to transfer' })
    @IsNotEmpty()
    @IsNumber()
    productId: number;

    @ApiProperty({ example: 1, description: 'ID of the source location bin' })
    @IsNotEmpty()
    @IsNumber()
    fromLocationId: number;

    @ApiProperty({ example: 2, description: 'ID of the destination location bin' })
    @IsNotEmpty()
    @IsNumber()
    toLocationId: number;

    @ApiProperty({ example: 'BATCH-001', description: 'Production batch number to transfer' })
    @IsNotEmpty()
    @IsString()
    batchNo: string;

    @ApiProperty({ example: 50, description: 'Quantity of items to transfer' })
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    qty: number;
}
