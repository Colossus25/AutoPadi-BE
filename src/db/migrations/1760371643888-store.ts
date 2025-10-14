import { MigrationInterface, QueryRunner } from "typeorm";

export class Store1760371643888 implements MigrationInterface {
    name = 'Store1760371643888'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "stores" ("id" SERIAL NOT NULL, "name" character varying, "description" character varying, "image" character varying, "category" character varying, "address" character varying, "subscription_type" character varying, "registration_no" character varying, "phone" character varying, "email" character varying, "website" character varying, "contact_person_name" character varying, "contact_person_phone" character varying, "location_coordinates" character varying, "subscription_plan" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" integer, CONSTRAINT "PK_7aa6e7d71fa7acdd7ca43d7c9cb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "stores" ADD CONSTRAINT "FK_2e3cdd19eb6b671045936b4035e" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stores" DROP CONSTRAINT "FK_2e3cdd19eb6b671045936b4035e"`);
        await queryRunner.query(`DROP TABLE "stores"`);
    }

}
