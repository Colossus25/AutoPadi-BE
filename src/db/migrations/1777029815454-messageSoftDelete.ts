import { MigrationInterface, QueryRunner } from "typeorm";

export class MessageSoftDelete1777029815454 implements MigrationInterface {
    name = 'MessageSoftDelete1777029815454'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" ADD "deleted_at" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" DROP COLUMN "deleted_at"`);
    }
}
