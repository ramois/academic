import { IsNotEmpty, IsString, IsUUID, Matches } from 'class-validator';

const SLOT_FORMAT = /^(Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo)\s+\d{2}:\d{2}-\d{2}:\d{2}$/;

export class CreateScheduleDTO {
  @IsUUID()
  @IsNotEmpty({ message: 'courseId es requerido' })
  courseId: string;

  @IsString()
  @IsNotEmpty({ message: 'slot es requerido' })
  @Matches(SLOT_FORMAT, {
    message: 'El formato del horario debe ser: "Día HH:MM-HH:MM" (ej: "Lunes 09:00-11:00")',
  })
  slot: string;
}
