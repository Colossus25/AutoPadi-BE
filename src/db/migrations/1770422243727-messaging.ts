import { MigrationInterface, QueryRunner } from "typeorm";

export class Messaging1770422243727 implements MigrationInterface {
    name = 'Messaging1770422243727'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "conversation_participants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" uuid NOT NULL, "user_id" integer NOT NULL, "joined_at" TIMESTAMP NOT NULL DEFAULT now(), "last_read_at" TIMESTAMP, CONSTRAINT "PK_61b51428ad9453f5921369fbe94" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fdcd6405d74e797f10fa836033" ON "conversation_participants" ("conversation_id", "user_id") `);
        await queryRunner.query(`CREATE TYPE "public"."conversations_context_type_enum" AS ENUM('product_inquiry', 'booking', 'driver_job', 'general')`);
        await queryRunner.query(`CREATE TYPE "public"."conversations_status_enum" AS ENUM('active', 'archived', 'blocked')`);
        await queryRunner.query(`CREATE TABLE "conversations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "context_type" "public"."conversations_context_type_enum" NOT NULL DEFAULT 'general', "context_id" uuid, "status" "public"."conversations_status_enum" NOT NULL DEFAULT 'active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ee34f4f7ced4ec8681f26bf04ef" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_517acf7e04a7232adb0c760c4b" ON "conversations" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_34c91e6b46093cc00c7c9784de" ON "conversations" ("context_type", "context_id") `);
        await queryRunner.query(`CREATE TABLE "messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" uuid NOT NULL, "sender_id" integer NOT NULL, "text" text NOT NULL, "attachments" json, "is_read" boolean NOT NULL DEFAULT false, "read_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_18325f38ae6de43878487eff986" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_22133395bd13b970ccd0c34ab2" ON "messages" ("sender_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8584a1974e1ca95f4861d975ff" ON "messages" ("conversation_id", "created_at") `);
        await queryRunner.query(`ALTER TABLE "conversation_participants" ADD CONSTRAINT "FK_1559e8a16b828f2e836a2312800" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" ADD CONSTRAINT "FK_377d4041a495b81ee1a85ae026f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "messages" ADD CONSTRAINT "FK_22133395bd13b970ccd0c34ab22" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_22133395bd13b970ccd0c34ab22"`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT "FK_3bc55a7c3f9ed54b520bb5cfe23"`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" DROP CONSTRAINT "FK_377d4041a495b81ee1a85ae026f"`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" DROP CONSTRAINT "FK_1559e8a16b828f2e836a2312800"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8584a1974e1ca95f4861d975ff"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_22133395bd13b970ccd0c34ab2"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_34c91e6b46093cc00c7c9784de"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_517acf7e04a7232adb0c760c4b"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
        await queryRunner.query(`DROP TYPE "public"."conversations_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."conversations_context_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fdcd6405d74e797f10fa836033"`);
        await queryRunner.query(`DROP TABLE "conversation_participants"`);
    }

}
