import { MigrationInterface, QueryRunner } from "typeorm";

export class DriverJobCounters1777030759834 implements MigrationInterface {
    name = 'DriverJobCounters1777030759834'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "driver_jobs" ADD "views_count" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "driver_jobs" ADD "clicks_count" integer NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "driver_jobs" DROP COLUMN "clicks_count"`);
        await queryRunner.query(`ALTER TABLE "driver_jobs" DROP COLUMN "views_count"`);
    }
}
