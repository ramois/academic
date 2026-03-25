import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCourseResources1731234568002 implements MigrationInterface {
  name = 'CreateCourseResources1731234568002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "course_resources" (
        "id" uuid NOT NULL,
        "course_id" uuid NOT NULL,
        "resource_type" character varying NOT NULL,
        "title" character varying NOT NULL,
        "description" text,
        "url" text,
        "file_name" character varying,
        "mime_type" character varying,
        "sort_order" integer NOT NULL DEFAULT 0,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_course_resources" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_course_resources_resource_type" CHECK (
          "resource_type" IN ('task', 'video', 'file', 'image')
        ),
        CONSTRAINT "FK_course_resources_course" FOREIGN KEY ("course_id")
          REFERENCES "courses" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_course_resources_course_id"
      ON "course_resources" ("course_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_course_resources_course_sort"
      ON "course_resources" ("course_id", "sort_order")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "course_resources"`);
  }
}
