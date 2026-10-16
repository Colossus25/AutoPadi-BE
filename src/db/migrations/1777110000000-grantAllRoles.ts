import { MigrationInterface, QueryRunner } from "typeorm";

export class GrantAllRoles1777110000000 implements MigrationInterface {
    name = 'GrantAllRoles1777110000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Give every existing user all 5 roles. users.user_type (the active role) is untouched.
        await queryRunner.query(`
            INSERT INTO "user_roles" ("user_id", "user_type")
            SELECT u."id", r."user_type"
            FROM "users" u
            CROSS JOIN (VALUES ('buyer'), ('auto dealer'), ('service provider'), ('driver'), ('driver employer')) AS r("user_type")
            ON CONFLICT ("user_id", "user_type") DO NOTHING
        `);
    }

    public async down(): Promise<void> {
        // Not reversible: we can't tell granted roles from ones users added themselves.
    }
}
