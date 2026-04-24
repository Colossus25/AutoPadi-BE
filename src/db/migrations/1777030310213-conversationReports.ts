import { MigrationInterface, QueryRunner } from "typeorm";

export class ConversationReports1777030310213 implements MigrationInterface {
    name = 'ConversationReports1777030310213'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."conversation_reports_reason_enum" AS ENUM('spam', 'harassment', 'hate_speech', 'scam', 'inappropriate_content', 'impersonation', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."conversation_reports_status_enum" AS ENUM('pending', 'reviewing', 'resolved', 'dismissed')`);
        await queryRunner.query(`CREATE TABLE "conversation_reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "conversation_id" uuid NOT NULL, "reporter_id" integer NOT NULL, "reported_user_id" integer NOT NULL, "message_id" uuid, "reason" "public"."conversation_reports_reason_enum" NOT NULL, "description" text, "status" "public"."conversation_reports_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_conversation_reports_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_conversation_reports_conversation_id" ON "conversation_reports" ("conversation_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_conversation_reports_reporter_id" ON "conversation_reports" ("reporter_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_conversation_reports_reported_user_id" ON "conversation_reports" ("reported_user_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_conversation_reports_status" ON "conversation_reports" ("status")`);
        await queryRunner.query(`ALTER TABLE "conversation_reports" ADD CONSTRAINT "FK_conversation_reports_conversation" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_reports" ADD CONSTRAINT "FK_conversation_reports_reporter" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_reports" ADD CONSTRAINT "FK_conversation_reports_reported_user" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_reports" ADD CONSTRAINT "FK_conversation_reports_message" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversation_reports" DROP CONSTRAINT "FK_conversation_reports_message"`);
        await queryRunner.query(`ALTER TABLE "conversation_reports" DROP CONSTRAINT "FK_conversation_reports_reported_user"`);
        await queryRunner.query(`ALTER TABLE "conversation_reports" DROP CONSTRAINT "FK_conversation_reports_reporter"`);
        await queryRunner.query(`ALTER TABLE "conversation_reports" DROP CONSTRAINT "FK_conversation_reports_conversation"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_conversation_reports_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_conversation_reports_reported_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_conversation_reports_reporter_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_conversation_reports_conversation_id"`);
        await queryRunner.query(`DROP TABLE "conversation_reports"`);
        await queryRunner.query(`DROP TYPE "public"."conversation_reports_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."conversation_reports_reason_enum"`);
    }
}
