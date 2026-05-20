import { MigrationInterface, QueryRunner } from "typeorm";

export class DeviceTokens1777050000000 implements MigrationInterface {
    name = 'DeviceTokens1777050000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."device_tokens_platform_enum" AS ENUM('android', 'ios', 'web')`);
        await queryRunner.query(`CREATE TABLE "device_tokens" (
            "id" SERIAL NOT NULL,
            "token" text NOT NULL,
            "platform" "public"."device_tokens_platform_enum" NOT NULL DEFAULT 'android',
            "last_used_at" TIMESTAMP,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "user_id" integer,
            CONSTRAINT "PK_device_tokens" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_device_tokens_token" ON "device_tokens" ("token")`);
        await queryRunner.query(`ALTER TABLE "device_tokens" ADD CONSTRAINT "FK_device_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "device_tokens" DROP CONSTRAINT "FK_device_tokens_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_device_tokens_token"`);
        await queryRunner.query(`DROP TABLE "device_tokens"`);
        await queryRunner.query(`DROP TYPE "public"."device_tokens_platform_enum"`);
    }
}
