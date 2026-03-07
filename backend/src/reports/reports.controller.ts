import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @ApiOperation({ summary: 'Get aggregated dashboard summary data' })
    @ApiResponse({ status: 200, description: 'Summary data aggregated successfully.' })
    @Get('summary')
    getSummary() {
        return this.reportsService.getSummary();
    }
}
