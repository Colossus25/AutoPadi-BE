import { MigrationInterface, QueryRunner } from "typeorm";

export class Banner1760195626051 implements MigrationInterface {
    name = 'Banner1760195626051'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "banners" ("id" SERIAL NOT NULL, "title" character varying, "description" character varying, "image" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" integer, CONSTRAINT "PK_e9b186b959296fcb940790d31c3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "banners" ADD CONSTRAINT "FK_6030fcd59bf52e2bb0983e3be38" FOREIGN KEY ("created_by") REFERENCES "superadmins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "banners" DROP CONSTRAINT "FK_6030fcd59bf52e2bb0983e3be38"`);
        await queryRunner.query(`DROP TABLE "banners"`);
    }

}
