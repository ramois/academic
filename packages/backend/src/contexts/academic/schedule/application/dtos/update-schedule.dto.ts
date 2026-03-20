import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';

const SLOT_FORMAT = /^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)\s+\d{2}:\d{2}-\d{2}:\d{2}$/;

export class UpdateScheduleDTO {
  @IsUUID()
  @IsOptional()
  courseId?: string;

  @IsString()
  @IsOptional()
  @Matches(SLOT_FORMAT, {
    message: 'El formato del horario debe ser: "Día HH:MM-HH:MM" (ej: "Lunes 09:00-11:00")',
  })
  slot?: string;
}
