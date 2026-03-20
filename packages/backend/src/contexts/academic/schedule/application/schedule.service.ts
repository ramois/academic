import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Schedule } from '../domain/schedule.entity';
import { IScheduleRepository, SCHEDULE_REPOSITORY, ScheduleSortField } from '../domain/schedule.repository';
import { CourseService } from '../../course/application/course.service';

export type SchedulesPaginatedResult = {
  data: Array<Schedule & { courseName: string;}>;
  total: number;
};

const DAY_ORDER: Record<string, number> = {
  'Lunes': 0,
  'Martes': 1,
  'Miércoles': 2,
  'Jueves': 3,
  'Viernes': 4,
  'Sábado': 5,
  'Domingo': 6,
};

@Injectable()
export class ScheduleService {
  constructor(
    @Inject(SCHEDULE_REPOSITORY)
    private readonly scheduleRepository: IScheduleRepository,
    private readonly courseService: CourseService,
  ) {}

  private parseSlotTime(slot: string): { startHour: number; endHour: number } | null {
    const timeMatch = slot.match(/(\d{2}):(\d{2})-(\d{2}):(\d{2})/);
    if (!timeMatch) return null;
    const startHour = parseInt(timeMatch[1], 10) + parseInt(timeMatch[2], 10) / 60;
    const endHour = parseInt(timeMatch[3], 10) + parseInt(timeMatch[4], 10) / 60;
    return { startHour, endHour };
  }

  private getSlotDay(slot: string): string {
    return slot.split(' ')[0];
  }

  private checkTimeOverlap(time1: { startHour: number; endHour: number }, time2: { startHour: number; endHour: number }): boolean {
    return time1.startHour < time2.endHour && time1.endHour > time2.startHour;
  }

  private async validateCourseExists(courseId: string): Promise<void> {
    const course = await this.courseService.findById(courseId);
    if (!course) {
      throw new BadRequestException(`El curso con ID ${courseId} no existe`);
    }
  }

  private async validateNoDuplicate(courseId: string, slot: string, excludeId?: string): Promise<void> {
    const allSchedules = await this.scheduleRepository.findAll();
    const exists = allSchedules.some(s => 
      s.courseId === courseId && 
      s.slot === slot &&
      (!excludeId || s.id !== excludeId)
    );
    if (exists) {
      throw new BadRequestException(`Ya existe un horario igual para este curso`);
    }
  }

  private async validateNoOverlap(courseId: string, slot: string, excludeId?: string): Promise<void> {
    const allSchedules = await this.scheduleRepository.findAll();
    const newSlotDay = this.getSlotDay(slot);
    const newSlotTime = this.parseSlotTime(slot);
    
    if (!newSlotTime) return;

    const overlapping = allSchedules.find(s => {
      if (s.courseId !== courseId || (!excludeId || s.id === excludeId)) return false;
      if (this.getSlotDay(s.slot) !== newSlotDay) return false;
      
      const existingTime = this.parseSlotTime(s.slot);
      if (!existingTime) return false;
      
      return this.checkTimeOverlap(newSlotTime, existingTime);
    });

    if (overlapping) {
      throw new BadRequestException(`El horario se superpone con otro existente en el mismo curso`);
    }
  }

  private sortSchedules(
    data: Array<Schedule & { courseName: string }>,
    sortBy?: ScheduleSortField,
    sortOrder?: 'asc' | 'desc',
  ): Array<Schedule & { courseName: string }> {
    if (!sortBy) return data;

    const sorted = [...data];
    const isAsc = sortOrder === 'asc';

    sorted.sort((a, b) => {
      let compareResult = 0;

      if (sortBy === 'courseName') {
        compareResult = a.courseName.localeCompare(b.courseName);
      } else if (sortBy === 'slot') {

        const [dayA, timeA] = a.slot.split(' ');
        const [dayB, timeB] = b.slot.split(' ');
        
        console.log('DEBUG sortSchedules:', { dayA, timeA, dayB, timeB, 'DAY_ORDER[dayA]': DAY_ORDER[dayA], 'DAY_ORDER[dayB]': DAY_ORDER[dayB] });
        
        const dayOrderA = DAY_ORDER[dayA] ?? 7;
        const dayOrderB = DAY_ORDER[dayB] ?? 7;

        if (dayOrderA !== dayOrderB) {
          compareResult = dayOrderA - dayOrderB;
        } else {
          compareResult = (timeA || '').localeCompare(timeB || '');
        }
      }

      return isAsc ? compareResult : -compareResult;
    });

    return sorted;
  }

  async findAll(): Promise<Schedule[]> {
    return this.scheduleRepository.findAll();
  }

  async findAllWithCourseInfo(): Promise<
      Array<Schedule & { courseName: string }>
    > {
      const schedules = await this.scheduleRepository.findAll();
      const result: Array<Schedule & { courseName: string }> = [];
      for (const schedule of schedules) {
        const course = await this.courseService.findById(schedule.courseId);
        result.push({
          ...schedule,
          courseName: course?.name ?? '',
        });
      }
      return result;
    }
  
    async findPaginatedWithUserInfo(
      page: number,
      pageSize: number,
      sortBy?: ScheduleSortField,
      sortOrder?: 'asc' | 'desc',
    ): Promise<SchedulesPaginatedResult> {
      const offset = (Math.max(1, page) - 1) * Math.max(1, pageSize);
      const limit = Math.min(100, Math.max(1, pageSize));
      
      const shouldSortInMemory = sortBy === 'courseName' || sortBy === 'slot';
      
      let schedules: Schedule[];
      let total: number;

      if (shouldSortInMemory) {
      
        schedules = await this.scheduleRepository.findAll();
        total = schedules.length;
      } else {
      
        const result = await this.scheduleRepository.findPaginated({
          offset,
          limit,
          sortBy,
          sortOrder,
        });
        schedules = result.data;
        total = result.total;
      }
      
      const data: Array<Schedule & { courseName: string }> = [];
      for (const schedule of schedules) {
        const course = await this.courseService.findById(schedule.courseId);
        data.push({
          ...schedule,
          courseName: course?.name ?? '',
        });
      }

      const sorted = shouldSortInMemory 
        ? this.sortSchedules(data, sortBy, sortOrder)
        : data;

      const paginatedData = sorted.slice(offset, offset + limit);
      
      return { data: paginatedData, total };
    }

  async findById(id: string): Promise<Schedule | null> {
    return this.scheduleRepository.findById(id);
  }

  async create(data: { courseId: string; slot: string }): Promise<Schedule> {
    await this.validateCourseExists(data.courseId);
    await this.validateNoDuplicate(data.courseId, data.slot);
    await this.validateNoOverlap(data.courseId, data.slot);

    const id = crypto.randomUUID();
    const schedule = new Schedule(id, data.courseId, data.slot);
    return this.scheduleRepository.save(schedule);
  }

  async update(id: string, data:{ slot?: string, courseId?: string}): Promise<Schedule | null>{
    const schedule = await this.scheduleRepository.findById(id);
    if (!schedule) return null;

    const slot = data.slot?.trim() ?? schedule.slot;
    const courseId = data.courseId?.trim() ?? schedule.courseId;

    if (data.courseId) {
      await this.validateCourseExists(courseId);
    }
    if (data.slot || data.courseId) {
      await this.validateNoDuplicate(courseId, slot, id);
      await this.validateNoOverlap(courseId, slot, id);
    }

    const updated = new Schedule(
      schedule.id,
      courseId,
      slot
    );
    
    await this.scheduleRepository.save(updated);

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const schedule = await this.scheduleRepository.findById(id);
    if (!schedule) return false;
    await this.scheduleRepository.delete(id);
    return true;
  }
}
