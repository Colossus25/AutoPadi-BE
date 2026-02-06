import { MigrationInterface, QueryRunner } from "typeorm";

export class Booking1770408462312 implements MigrationInterface {
    name = 'Booking1770408462312'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "booking_reviews" ("id" SERIAL NOT NULL, "rating" integer NOT NULL, "comment" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "booking_id" integer, "reviewer_id" integer, CONSTRAINT "PK_97ae1e947fe4a85ac35abb56c2d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "booking_reports" ("id" SERIAL NOT NULL, "reason" text NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "booking_id" integer, "reporter_id" integer, CONSTRAINT "PK_d02bdad79f288fad8192769b7f6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "bookings" ("id" SERIAL NOT NULL, "status" character varying NOT NULL, "booking_date" TIMESTAMP, "preferred_time" character varying, "location" character varying, "description" character varying, "estimated_cost" numeric(10,2), "final_cost" numeric(10,2), "cancelled_reason" character varying, "declined_reason" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "service_id" integer, "user_id" integer, "service_provider_id" integer, CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "booking_reviews" ADD CONSTRAINT "FK_e233995315f106b7b19eb5d99bc" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "booking_reviews" ADD CONSTRAINT "FK_3eea9c8177ad1281b9be25f42c7" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "booking_reports" ADD CONSTRAINT "FK_91ac4664a5827d382a84d3ec9e8" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "booking_reports" ADD CONSTRAINT "FK_1ba844c307508aa20e878195be7" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_df22e2beaabc33a432b4f65e3c2" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_64cd97487c5c42806458ab5520c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_12a0a22c64de5ca379662109301" FOREIGN KEY ("service_provider_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_12a0a22c64de5ca379662109301"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_64cd97487c5c42806458ab5520c"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_df22e2beaabc33a432b4f65e3c2"`);
        await queryRunner.query(`ALTER TABLE "booking_reports" DROP CONSTRAINT "FK_1ba844c307508aa20e878195be7"`);
        await queryRunner.query(`ALTER TABLE "booking_reports" DROP CONSTRAINT "FK_91ac4664a5827d382a84d3ec9e8"`);
        await queryRunner.query(`ALTER TABLE "booking_reviews" DROP CONSTRAINT "FK_3eea9c8177ad1281b9be25f42c7"`);
        await queryRunner.query(`ALTER TABLE "booking_reviews" DROP CONSTRAINT "FK_e233995315f106b7b19eb5d99bc"`);
        await queryRunner.query(`DROP TABLE "bookings"`);
        await queryRunner.query(`DROP TABLE "booking_reports"`);
        await queryRunner.query(`DROP TABLE "booking_reviews"`);
    }

}
