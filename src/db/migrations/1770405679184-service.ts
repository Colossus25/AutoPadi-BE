import { MigrationInterface, QueryRunner } from "typeorm";

export class Service1770405679184 implements MigrationInterface {
    name = 'Service1770405679184'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "services" ("id" SERIAL NOT NULL, "name" character varying, "description" character varying, "media" text array, "category" text, "region" character varying, "address" character varying, "subscription_type" character varying, "technician_categories" text, "specialized_in" text, "type_of_vehicles" text, "service_location" character varying, "pricing" character varying, "specify_price_type" character varying, "contact_person_name" character varying, "contact_person_phone" character varying, "location_coordinates" character varying, "subscription_plan" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" integer, CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "service_attributes" ("id" SERIAL NOT NULL, "attribute_type" character varying NOT NULL, "value" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" integer, CONSTRAINT "PK_892ef4f4b011cf132e25adf7a46" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "services" ADD CONSTRAINT "FK_c896350eb4a5969991bccfb0759" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "service_attributes" ADD CONSTRAINT "FK_ebdf869bd827d41e0679a9b8207" FOREIGN KEY ("created_by") REFERENCES "superadmins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "service_attributes" DROP CONSTRAINT "FK_ebdf869bd827d41e0679a9b8207"`);
        await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "FK_c896350eb4a5969991bccfb0759"`);
        await queryRunner.query(`DROP TABLE "service_attributes"`);
        await queryRunner.query(`DROP TABLE "services"`);
    }

}
