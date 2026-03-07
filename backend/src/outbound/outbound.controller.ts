import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { OutboundService } from './outbound.service';
import { CreateOutboundDto } from './dto/create-outbound.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('outbound')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('outbound')
export class OutboundController {
    constructor(private readonly outboundService: OutboundService) { }

    @ApiOperation({ summary: 'Dispatch products with FEFO optimization' })
    @ApiResponse({ status: 201, description: 'Products successfully dispatched.' })
    @ApiResponse({ status: 400, description: 'Insufficient stock.' })
    @ApiResponse({ status: 404, description: 'Product not found.' })
    @Post()
    async processOutbound(@Request() req, @Body() createOutboundDto: CreateOutboundDto) {
        const userId = req.user.userId;
        return this.outboundService.processOutbound(userId, createOutboundDto);
    }
}
