import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('master/locations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('master/locations')
export class LocationController {
    constructor(private readonly locationService: LocationService) { }

    @ApiOperation({ summary: 'Create a new location bin' })
    @Post()
    create(@Body() createLocationDto: CreateLocationDto) {
        return this.locationService.create(createLocationDto);
    }

    @ApiOperation({ summary: 'Get all locations' })
    @Get()
    findAll() {
        return this.locationService.findAll();
    }

    @ApiOperation({ summary: 'Get a location by ID' })
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.locationService.findOne(id);
    }

    @ApiOperation({ summary: 'Update a location by ID' })
    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() updateLocationDto: UpdateLocationDto) {
        return this.locationService.update(id, updateLocationDto);
    }

    @ApiOperation({ summary: 'Delete a location by ID' })
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.locationService.remove(id);
    }
}
