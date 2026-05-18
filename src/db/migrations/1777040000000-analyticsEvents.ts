import { MigrationInterface, QueryRunner } from "typeorm";

export class AnalyticsEvents1777040000000 implements MigrationInterface {
    name = 'AnalyticsEvents1777040000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."analytics_events_resource_type_enum" AS ENUM('store', 'product', 'driver', 'driver_job', 'service')`);
        await queryRunner.query(`CREATE TYPE "public"."analytics_events_event_type_enum" AS ENUM('view', 'click', 'enquiry')`);
        await queryRunner.query(`CREATE TABLE "analytics_events" (
            "id" SERIAL NOT NULL,
            "resource_type" "public"."analytics_events_resource_type_enum" NOT NULL,
            "resource_id" integer NOT NULL,
            "event_type" "public"."analytics_events_event_type_enum" NOT NULL,
            "user_id" integer NOT NULL,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_analytics_events" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`CREATE INDEX "IDX_analytics_events_resource" ON "analytics_events" ("resource_type", "resource_id", "created_at")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_analytics_events_resource"`);
        await queryRunner.query(`DROP TABLE "analytics_events"`);
        await queryRunner.query(`DROP TYPE "public"."analytics_events_event_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."analytics_events_resource_type_enum"`);
    }
}
