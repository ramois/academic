import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { ScheduleService } from '../../../contexts/academic/schedule/application/schedule.service';
import { ScheduleSortField } from 'src/contexts/academic/schedule/domain/schedule.repository';
import { CreateScheduleDTO, UpdateScheduleDTO } from 'src/contexts/academic/schedule/application/dtos';

const SORT_FIELDS: ScheduleSortField[] = ['slot', 'createdAt', 'courseName'];

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get()
  async findAll(
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const page = pageStr != null ? parseInt(pageStr, 10) : undefined;
    const pageSize = pageSizeStr != null ? parseInt(pageSizeStr, 10) : undefined;
    if (page != null && !Number.isNaN(page) && pageSize != null && !Number.isNaN(pageSize)) {
      const sort = sortBy && SORT_FIELDS.includes(sortBy as ScheduleSortField) ? sortBy as ScheduleSortField : undefined;
      const order = sortOrder === 'desc' || sortOrder === 'asc' ? sortOrder : undefined;
      return this.scheduleService.findPaginatedWithUserInfo(
        page,
        pageSize,
        sort,
        order,
      );
    }
    return this.scheduleService.findAllWithCourseInfo();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const schedule = await this.scheduleService.findById(id);
    if (!schedule) throw new NotFoundException('Schedule not found');
    return schedule;
  }

  @Post()
  async create(@Body() body: CreateScheduleDTO) {
    return this.scheduleService.create(body);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateScheduleDTO){
      const schedule = await this.scheduleService.update(id, body);
      if (!schedule) throw new NotFoundException('Schedule not found');
      return schedule;
    }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const deleted = await this.scheduleService.delete(id);
    if (!deleted) throw new NotFoundException('Schedule not found');
  }
}
