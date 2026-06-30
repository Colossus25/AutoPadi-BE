import { MigrationInterface, QueryRunner } from "typeorm";

export class GoogleAuth1777080000000 implements MigrationInterface {
    name = 'GoogleAuth1777080000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Social (Google) accounts have no password.
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "provider" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "google_id" character varying`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_users_google_id" ON "users" ("google_id")`);
        // Existing accounts are all email+password.
        await queryRunner.query(`UPDATE "users" SET "provider" = 'local' WHERE "provider" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_users_google_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "provider"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`);
    }
}
