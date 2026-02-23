import { MigrationInterface, QueryRunner } from "typeorm";

export class Subscription1771272124851 implements MigrationInterface {
    name = 'Subscription1771272124851'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."subscription_plans_billing_interval_enum" AS ENUM('monthly', 'yearly', 'quarterly')`);
        await queryRunner.query(`CREATE TYPE "public"."subscription_plans_status_enum" AS ENUM('active', 'inactive')`);
        await queryRunner.query(`CREATE TABLE "subscription_plans" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "amount" bigint NOT NULL, "billing_interval" "public"."subscription_plans_billing_interval_enum" NOT NULL DEFAULT 'monthly', "free_trial_days" integer NOT NULL DEFAULT '0', "description" text, "features" text, "status" "public"."subscription_plans_status_enum" NOT NULL DEFAULT 'active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9ab8fe6918451ab3d0a4fb6bb0c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."user_subscriptions_status_enum" AS ENUM('active', 'trial', 'expired', 'canceled', 'payment_pending')`);
        await queryRunner.query(`CREATE TABLE "user_subscriptions" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "subscription_plan_id" integer NOT NULL, "status" "public"."user_subscriptions_status_enum" NOT NULL DEFAULT 'payment_pending', "subscription_start_date" TIMESTAMP, "subscription_end_date" TIMESTAMP, "next_charge_date" TIMESTAMP, "free_trial_active" boolean NOT NULL DEFAULT false, "free_trial_end_date" TIMESTAMP, "paystack_authorization_code" character varying, "paystack_reference" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9e928b0954e51705ab44988812c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'success', 'failed')`);
        await queryRunner.query(`CREATE TYPE "public"."payments_payment_type_enum" AS ENUM('initial', 'renewal')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "subscription_plan_id" integer NOT NULL, "user_subscription_id" integer, "amount" bigint NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending', "payment_type" "public"."payments_payment_type_enum" NOT NULL DEFAULT 'initial', "paystack_reference" character varying, "paystack_message" character varying, "paid_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "services" ADD "user_subscription_id" integer`);
        await queryRunner.query(`ALTER TABLE "driver_jobs" ADD "user_subscription_id" integer`);
        await queryRunner.query(`ALTER TABLE "stores" ADD "user_subscription_id" integer`);
        await queryRunner.query(`ALTER TABLE "driver_profiles" ADD "user_subscription_id" integer`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" ADD CONSTRAINT "FK_0641da02314913e28f6131310eb" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" ADD CONSTRAINT "FK_b6e02561ba40a3798a7e1432f2e" FOREIGN KEY ("subscription_plan_id") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_427785468fb7d2733f59e7d7d39" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_0c024bdfc636885d3ce044cd290" FOREIGN KEY ("subscription_plan_id") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_933d8c7b359f5fd3ec9e31b4373" FOREIGN KEY ("user_subscription_id") REFERENCES "user_subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "services" ADD CONSTRAINT "FK_920bc28cef3c81860e856b0b001" FOREIGN KEY ("user_subscription_id") REFERENCES "user_subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "driver_jobs" ADD CONSTRAINT "FK_e9c6551705bbe27f9c944b8fec9" FOREIGN KEY ("user_subscription_id") REFERENCES "user_subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "stores" ADD CONSTRAINT "FK_81ff86ab261d4105447c5bb2a66" FOREIGN KEY ("user_subscription_id") REFERENCES "user_subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "driver_profiles" ADD CONSTRAINT "FK_17470699666c35a6ed8ca6b72b0" FOREIGN KEY ("user_subscription_id") REFERENCES "user_subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "driver_profiles" DROP CONSTRAINT "FK_17470699666c35a6ed8ca6b72b0"`);
        await queryRunner.query(`ALTER TABLE "stores" DROP CONSTRAINT "FK_81ff86ab261d4105447c5bb2a66"`);
        await queryRunner.query(`ALTER TABLE "driver_jobs" DROP CONSTRAINT "FK_e9c6551705bbe27f9c944b8fec9"`);
        await queryRunner.query(`ALTER TABLE "services" DROP CONSTRAINT "FK_920bc28cef3c81860e856b0b001"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_933d8c7b359f5fd3ec9e31b4373"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_0c024bdfc636885d3ce044cd290"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_427785468fb7d2733f59e7d7d39"`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" DROP CONSTRAINT "FK_b6e02561ba40a3798a7e1432f2e"`);
        await queryRunner.query(`ALTER TABLE "user_subscriptions" DROP CONSTRAINT "FK_0641da02314913e28f6131310eb"`);
        await queryRunner.query(`ALTER TABLE "driver_profiles" DROP COLUMN "user_subscription_id"`);
        await queryRunner.query(`ALTER TABLE "stores" DROP COLUMN "user_subscription_id"`);
        await queryRunner.query(`ALTER TABLE "driver_jobs" DROP COLUMN "user_subscription_id"`);
        await queryRunner.query(`ALTER TABLE "services" DROP COLUMN "user_subscription_id"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_payment_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP TABLE "user_subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."user_subscriptions_status_enum"`);
        await queryRunner.query(`DROP TABLE "subscription_plans"`);
        await queryRunner.query(`DROP TYPE "public"."subscription_plans_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."subscription_plans_billing_interval_enum"`);
    }

}
