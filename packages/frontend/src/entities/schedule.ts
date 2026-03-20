export type Schedule = {
    id: string,
    courseId: string,
    courseName?: string,
    slot: string, 
}

export type CreateScheduleDto = {
    courseId: string,
    slot: string, 
}

export type UpdateScheduleDto = {
    courseId?: string,
    slot?: string, 
}