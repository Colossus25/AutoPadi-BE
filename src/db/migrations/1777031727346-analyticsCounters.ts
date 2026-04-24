import { MigrationInterface, QueryRunner } from "typeorm";

export class AnalyticsCounters1777031727346 implements MigrationInterface {
    name = 'AnalyticsCounters1777031727346'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stores" ADD "views_count" integer NOT NULL DEFAULT 0`);

        await queryRunner.query(`ALTER TABLE "products" ADD "clicks_count" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "products" ADD "enquiries_count" integer NOT NULL DEFAULT 0`);

        await queryRunner.query(`ALTER TABLE "services" ADD "views_count" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "services" ADD "clicks_count" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "services" ADD "enquiries_count" integer NOT NULL DEFAULT 0`);

        await queryRunner.query(`ALTER TABLE "driver_profiles" ADD "views_count" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "driver_profiles" ADD "clicks_count" integer NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "driver_profiles" DROP COLUMN "clicks_count"`);
        await queryRunner.query(`ALTER TABLE "driver_profiles" DROP COLUMN "views_count"`);

        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "enquiries_count"`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "clicks_count"`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "views_count"`);

        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "enquiries_count"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "clicks_count"`);

        await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "views_count"`);
    }
}
