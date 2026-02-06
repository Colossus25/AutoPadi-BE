import { MigrationInterface, QueryRunner } from "typeorm";

export class ProuductAttributes1770403792075 implements MigrationInterface {
    name = 'ProuductAttributes1770403792075'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "product_attributes" ("id" SERIAL NOT NULL, "attribute_type" character varying NOT NULL, "value" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" integer, CONSTRAINT "PK_4fa18fc5c893cb9894fc40ca921" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "category"`);
        await queryRunner.query(`ALTER TABLE "products" ADD "category" text`);
        await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "category"`);
        await queryRunner.query(`ALTER TABLE "stores" ADD "category" text`);
        await queryRunner.query(`ALTER TABLE "product_attributes" ADD CONSTRAINT "FK_a1d948647aa0082c424a2b377ab" FOREIGN KEY ("created_by") REFERENCES "superadmins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_attributes" DROP CONSTRAINT "FK_a1d948647aa0082c424a2b377ab"`);
        await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "category"`);
        await queryRunner.query(`ALTER TABLE "stores" ADD "category" character varying`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "category"`);
        await queryRunner.query(`ALTER TABLE "products" ADD "category" character varying`);
        await queryRunner.query(`DROP TABLE "product_attributes"`);
    }

}
