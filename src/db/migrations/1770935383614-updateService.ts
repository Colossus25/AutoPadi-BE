import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateService1770935383614 implements MigrationInterface {
    name = 'UpdateService1770935383614'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "services" ADD "estimated_cost" numeric`);
        await queryRunner.query(`CREATE TYPE "public"."services_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "services" ADD "status" "public"."services_status_enum" NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "services" ADD "rejection_reason" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "rejection_reason"`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."services_status_enum"`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "estimated_cost"`);
    }

}
