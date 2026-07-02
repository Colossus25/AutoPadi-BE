import { MigrationInterface, QueryRunner } from "typeorm";

export class ConversationParticipantRole1777090000000 implements MigrationInterface {
    name = 'ConversationParticipantRole1777090000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // The role each participant acts in for a conversation. NULL = unscoped
        // (visible in every mode) — which is also the safe default for the
        // conversations that already exist.
        await queryRunner.query(`ALTER TABLE "conversation_participants" ADD "role" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversation_participants" DROP COLUMN "role"`);
    }
}
