import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
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

    @ApiOperation({ summary: 'Export inventory stock report to Excel' })
    @ApiResponse({ status: 200, description: 'Excel file downloaded successfully.' })
    @Get('export/excel')
    async exportExcel(@Res() res: Response) {
        const stream = await this.reportsService.exportExcel();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Stock_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

        // Pipe the exceljs stream to the response
        stream.pipe(res);
    }
}
