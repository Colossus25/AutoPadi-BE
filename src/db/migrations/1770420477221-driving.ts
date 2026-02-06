import { MigrationInterface, QueryRunner } from "typeorm";

export class Driving1770420477221 implements MigrationInterface {
    name = 'Driving1770420477221'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "driver_jobs" ("id" SERIAL NOT NULL, "title" character varying, "email" character varying, "phone" character varying, "address" character varying, "employing_type" character varying, "number_of_driver_needed" integer, "driver_gender" character varying, "driver_age" integer, "driver_level_of_education" character varying, "driver_marital_status" character varying, "religion" character varying, "driver_years_of_experience" integer, "valid_driver_license" boolean, "driver_must_reside_in_state" boolean, "accomodation_available" boolean, "type_of_vehicles" text, "subscription_plan" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" integer, CONSTRAINT "PK_8289237de2b285dbcac6928943b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "driver_profiles" ("id" SERIAL NOT NULL, "name" character varying, "email" character varying, "phone_number" character varying, "gender" character varying, "address" character varying, "level_of_education" character varying, "tribe" character varying, "age" integer, "marital_status" character varying, "religion" character varying, "years_of_experience" integer, "valid_driver_license" character varying, "utility_bill" character varying, "cv" character varying, "open_to_relocation" boolean, "relocation_state" character varying, "type_of_vehicles" text, "subscription_plan" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by" integer, CONSTRAINT "PK_6e002fc8a835351e070978fcad4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "driver_jobs" ADD CONSTRAINT "FK_3317240bd2831c24d25b9f79556" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "driver_profiles" ADD CONSTRAINT "FK_02ceaa431fd518a4676f6548f11" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "driver_profiles" DROP CONSTRAINT "FK_02ceaa431fd518a4676f6548f11"`);
        await queryRunner.query(`ALTER TABLE "driver_jobs" DROP CONSTRAINT "FK_3317240bd2831c24d25b9f79556"`);
        await queryRunner.query(`DROP TABLE "driver_profiles"`);
        await queryRunner.query(`DROP TABLE "driver_jobs"`);
    }

}
