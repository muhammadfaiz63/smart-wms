import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { InboundService } from './inbound.service';
import { CreateInboundDto } from './dto/create-inbound.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('inbound')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inbound')
export class InboundController {
    constructor(private readonly inboundService: InboundService) { }

    @ApiOperation({ summary: 'Receive products into the warehouse' })
    @ApiResponse({ status: 201, description: 'Products successfully received and stock updated.' })
    @ApiResponse({ status: 404, description: 'Product or Location not found.' })
    @Post()
    async receive(@Request() req, @Body() createInboundDto: CreateInboundDto) {
        const userId = req.user.userId;
        return this.inboundService.receiveProduct(userId, createInboundDto);
    }
}
