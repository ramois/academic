export const COURSE_RESOURCE_TYPES = [
  'task',
  'video',
  'file',
  'image',
] as const;

export type CourseResourceType = (typeof COURSE_RESOURCE_TYPES)[number];

export class CourseResource {
  constructor(
    public readonly id: string,
    public readonly courseId: string,
    public resourceType: CourseResourceType,
    public title: string,
    public description: string | null,
    public url: string | null,
    public fileName: string | null,
    public mimeType: string | null,
    public sortOrder: number,
    public metadata: Record<string, unknown> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
