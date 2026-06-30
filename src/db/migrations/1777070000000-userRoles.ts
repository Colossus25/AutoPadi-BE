import { MigrationInterface, QueryRunner } from "typeorm";

export class UserRoles1777070000000 implements MigrationInterface {
    name = 'UserRoles1777070000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_roles" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "user_type" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_user_roles" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_user_roles_user_type" ON "user_roles" ("user_id", "user_type")`);
        await queryRunner.query(`CREATE INDEX "IDX_user_roles_user_id" ON "user_roles" ("user_id")`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_user_roles_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        // Backfill: every existing user keeps their current user_type as a role.
        await queryRunner.query(`INSERT INTO "user_roles" ("user_id", "user_type") SELECT "id", "user_type" FROM "users" WHERE "user_type" IS NOT NULL ON CONFLICT ("user_id", "user_type") DO NOTHING`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_user_roles_user"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
    }
}
