import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @ApiOperation({ summary: 'Get all current stock across all locations' })
    @ApiResponse({ status: 200, description: 'List of all stocks with their locations and products.' })
    @Get()
    findAll() {
        return this.inventoryService.findAll();
    }

    @ApiOperation({ summary: 'Transfer stock between locations (e.g., to Quarantine)' })
    @ApiResponse({ status: 201, description: 'Stock successfully transferred.' })
    @ApiResponse({ status: 400, description: 'Insufficient stock or identical locations.' })
    @ApiResponse({ status: 404, description: 'Stock or location not found.' })
    @Post('transfer')
    transfer(@Request() req, @Body() transferStockDto: TransferStockDto) {
        const userId = req.user.userId;
        return this.inventoryService.transferStock(userId, transferStockDto);
    }
}
