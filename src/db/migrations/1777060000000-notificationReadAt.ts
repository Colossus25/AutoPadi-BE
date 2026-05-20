import { MigrationInterface, QueryRunner } from "typeorm";

export class NotificationReadAt1777060000000 implements MigrationInterface {
    name = 'NotificationReadAt1777060000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" ADD "read_at" TIMESTAMP`);
        await queryRunner.query(`CREATE INDEX "IDX_notifications_user_unread" ON "notifications" ("User_id", "read_at")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_notifications_user_unread"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "read_at"`);
    }
}
