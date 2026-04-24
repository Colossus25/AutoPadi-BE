import { MigrationInterface, QueryRunner } from "typeorm";

export class MessageTextNullable1777029511392 implements MigrationInterface {
    name = 'MessageTextNullable1777029511392'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "text" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "messages" ALTER COLUMN "text" SET NOT NULL`);
    }
}
