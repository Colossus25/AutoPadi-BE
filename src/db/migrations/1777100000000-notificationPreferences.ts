import { MigrationInterface, QueryRunner } from "typeorm";

export class NotificationPreferences1777100000000 implements MigrationInterface {
    name = 'NotificationPreferences1777100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "notification_preferences" (
            "id" SERIAL NOT NULL,
            "user_id" integer NOT NULL,
            "push_enabled" boolean NOT NULL DEFAULT true,
            "email_enabled" boolean NOT NULL DEFAULT true,
            "promotions_enabled" boolean NOT NULL DEFAULT true,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_notification_preferences" PRIMARY KEY ("id")
        )`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_notification_preferences_user" ON "notification_preferences" ("user_id")`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD CONSTRAINT "FK_notification_preferences_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP CONSTRAINT "FK_notification_preferences_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_notification_preferences_user"`);
        await queryRunner.query(`DROP TABLE "notification_preferences"`);
    }
}
