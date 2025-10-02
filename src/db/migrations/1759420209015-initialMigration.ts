import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1759420209015 implements MigrationInterface {
    name = 'InitialMigration1759420209015'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "super_permissions" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "group" character varying, "description" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_50544e1df2fac15c62b0fce3c05" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "super_roles" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_26f65eb71b64a9bd61c4c07347c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "logging" ("id" SERIAL NOT NULL, "entity" character varying NOT NULL, "note" text, "admin_id" integer NOT NULL, "visible" boolean NOT NULL DEFAULT false, "metadata" json, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2b6eefd2a39237bdb7e3545fa55" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "superadmins" ("id" SERIAL NOT NULL, "first_name" character varying, "last_name" character varying, "email" character varying NOT NULL, "password" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c6e0845de38355152105dfe94a2" UNIQUE ("email"), CONSTRAINT "PK_783604fbb1962a34417ed1c76eb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "super_group" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "parentId" integer, CONSTRAINT "PK_2948b64bd7dedb693d4a87ea6ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" SERIAL NOT NULL, "message" character varying NOT NULL, "tag" character varying NOT NULL, "metadata" json, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "User_id" integer, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_user_type_enum" AS ENUM('buyer', 'vendor', 'service provider', 'driver', 'driver employer')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "first_name" character varying, "last_name" character varying, "email" character varying NOT NULL, "password" character varying NOT NULL, "user_type" "public"."users_user_type_enum" NOT NULL, "phone" character varying, "address" character varying, "landmark" character varying, "city" character varying, "state" character varying, "profile_picture" text, "remember_token" text, "email_verified_at" TIMESTAMP, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notification_jobs" ("id" SERIAL NOT NULL, "tag" character varying NOT NULL, "queued" boolean NOT NULL DEFAULT false, "queue_able" boolean NOT NULL DEFAULT false, "action_note" text, "payload" json, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "PK_a9069c02b999ccf3a03b5e7bda9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."personal_access_token_token_type_enum" AS ENUM('otp', 'accessCodeReset', 'rememberToken', 'others')`);
        await queryRunner.query(`CREATE TABLE "personal_access_token" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "token_type" "public"."personal_access_token_token_type_enum" NOT NULL DEFAULT 'otp', "due_at" TIMESTAMP NOT NULL, "deleted_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, CONSTRAINT "UQ_6bea53a3ebc17e91ccc4526c6f8" UNIQUE ("token"), CONSTRAINT "PK_4f29b258be0b657a3f81b75f0b7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "super_role_permissions" ("superRolesId" integer NOT NULL, "superPermissionsId" integer NOT NULL, CONSTRAINT "PK_93ed3bdebdfcae09a26efeb16c9" PRIMARY KEY ("superRolesId", "superPermissionsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_93106d250b236116f9ccfc4a46" ON "super_role_permissions" ("superRolesId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a08e722fdfa6ded6ef39e7df34" ON "super_role_permissions" ("superPermissionsId") `);
        await queryRunner.query(`CREATE TABLE "super_admin_roles" ("superadminsId" integer NOT NULL, "superRolesId" integer NOT NULL, CONSTRAINT "PK_60110e7b8952cd8e1b47143b0ee" PRIMARY KEY ("superadminsId", "superRolesId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1b8cbc12a962d9432360be3600" ON "super_admin_roles" ("superadminsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d3350b241c18272b9893850068" ON "super_admin_roles" ("superRolesId") `);
        await queryRunner.query(`CREATE TABLE "super_admin_groups" ("superadminsId" integer NOT NULL, "superGroupId" integer NOT NULL, CONSTRAINT "PK_1e226c723ad500859d3dcf1b32a" PRIMARY KEY ("superadminsId", "superGroupId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0dfe742e246e607fcf1d6e2ce5" ON "super_admin_groups" ("superadminsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e5f9cd063d41b9da23d098dc05" ON "super_admin_groups" ("superGroupId") `);
        await queryRunner.query(`CREATE TABLE "super_group_members_superadmins" ("superGroupId" integer NOT NULL, "superadminsId" integer NOT NULL, CONSTRAINT "PK_a1e0d355ea61ed937f6351ab06b" PRIMARY KEY ("superGroupId", "superadminsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0e73703a1b46d1450afc5ea925" ON "super_group_members_superadmins" ("superGroupId") `);
        await queryRunner.query(`CREATE INDEX "IDX_1f0d1dff601db7880bd4015b79" ON "super_group_members_superadmins" ("superadminsId") `);
        await queryRunner.query(`CREATE TABLE "super_group_roles_super_roles" ("superGroupId" integer NOT NULL, "superRolesId" integer NOT NULL, CONSTRAINT "PK_16aa3295123d67948ef48c73e6f" PRIMARY KEY ("superGroupId", "superRolesId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9073b141d86e0288f4e6193ee6" ON "super_group_roles_super_roles" ("superGroupId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9b2740e766bb7830f10ff869c6" ON "super_group_roles_super_roles" ("superRolesId") `);
        await queryRunner.query(`ALTER TABLE "logging" ADD CONSTRAINT "FK_5d5600253f74800d60dad57dc4f" FOREIGN KEY ("admin_id") REFERENCES "superadmins"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "super_group" ADD CONSTRAINT "FK_5def153ff9ca39a3d56af5256e0" FOREIGN KEY ("parentId") REFERENCES "super_group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_40b16707329855ceb89d2208a9c" FOREIGN KEY ("User_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_jobs" ADD CONSTRAINT "FK_35735cbdf24bd062464cdc2ab46" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "personal_access_token" ADD CONSTRAINT "FK_2b3168fa1aa7d5f621c9df749a6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "super_role_permissions" ADD CONSTRAINT "FK_93106d250b236116f9ccfc4a460" FOREIGN KEY ("superRolesId") REFERENCES "super_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "super_role_permissions" ADD CONSTRAINT "FK_a08e722fdfa6ded6ef39e7df340" FOREIGN KEY ("superPermissionsId") REFERENCES "super_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "super_admin_roles" ADD CONSTRAINT "FK_1b8cbc12a962d9432360be36004" FOREIGN KEY ("superadminsId") REFERENCES "superadmins"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "super_admin_roles" ADD CONSTRAINT "FK_d3350b241c18272b9893850068f" FOREIGN KEY ("superRolesId") REFERENCES "super_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "super_admin_groups" ADD CONSTRAINT "FK_0dfe742e246e607fcf1d6e2ce58" FOREIGN KEY ("superadminsId") REFERENCES "superadmins"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "super_admin_groups" ADD CONSTRAINT "FK_e5f9cd063d41b9da23d098dc050" FOREIGN KEY ("superGroupId") REFERENCES "super_group"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "super_group_members_superadmins" ADD CONSTRAINT "FK_0e73703a1b46d1450afc5ea9253" FOREIGN KEY ("superGroupId") REFERENCES "super_group"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "super_group_members_superadmins" ADD CONSTRAINT "FK_1f0d1dff601db7880bd4015b79c" FOREIGN KEY ("superadminsId") REFERENCES "superadmins"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "super_group_roles_super_roles" ADD CONSTRAINT "FK_9073b141d86e0288f4e6193ee61" FOREIGN KEY ("superGroupId") REFERENCES "super_group"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "super_group_roles_super_roles" ADD CONSTRAINT "FK_9b2740e766bb7830f10ff869c64" FOREIGN KEY ("superRolesId") REFERENCES "super_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "super_group_roles_super_roles" DROP CONSTRAINT "FK_9b2740e766bb7830f10ff869c64"`);
        await queryRunner.query(`ALTER TABLE "super_group_roles_super_roles" DROP CONSTRAINT "FK_9073b141d86e0288f4e6193ee61"`);
        await queryRunner.query(`ALTER TABLE "super_group_members_superadmins" DROP CONSTRAINT "FK_1f0d1dff601db7880bd4015b79c"`);
        await queryRunner.query(`ALTER TABLE "super_group_members_superadmins" DROP CONSTRAINT "FK_0e73703a1b46d1450afc5ea9253"`);
        await queryRunner.query(`ALTER TABLE "super_admin_groups" DROP CONSTRAINT "FK_e5f9cd063d41b9da23d098dc050"`);
        await queryRunner.query(`ALTER TABLE "super_admin_groups" DROP CONSTRAINT "FK_0dfe742e246e607fcf1d6e2ce58"`);
        await queryRunner.query(`ALTER TABLE "super_admin_roles" DROP CONSTRAINT "FK_d3350b241c18272b9893850068f"`);
        await queryRunner.query(`ALTER TABLE "super_admin_roles" DROP CONSTRAINT "FK_1b8cbc12a962d9432360be36004"`);
        await queryRunner.query(`ALTER TABLE "super_role_permissions" DROP CONSTRAINT "FK_a08e722fdfa6ded6ef39e7df340"`);
        await queryRunner.query(`ALTER TABLE "super_role_permissions" DROP CONSTRAINT "FK_93106d250b236116f9ccfc4a460"`);
        await queryRunner.query(`ALTER TABLE "personal_access_token" DROP CONSTRAINT "FK_2b3168fa1aa7d5f621c9df749a6"`);
        await queryRunner.query(`ALTER TABLE "notification_jobs" DROP CONSTRAINT "FK_35735cbdf24bd062464cdc2ab46"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_40b16707329855ceb89d2208a9c"`);
        await queryRunner.query(`ALTER TABLE "super_group" DROP CONSTRAINT "FK_5def153ff9ca39a3d56af5256e0"`);
        await queryRunner.query(`ALTER TABLE "logging" DROP CONSTRAINT "FK_5d5600253f74800d60dad57dc4f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9b2740e766bb7830f10ff869c6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9073b141d86e0288f4e6193ee6"`);
        await queryRunner.query(`DROP TABLE "super_group_roles_super_roles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1f0d1dff601db7880bd4015b79"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0e73703a1b46d1450afc5ea925"`);
        await queryRunner.query(`DROP TABLE "super_group_members_superadmins"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e5f9cd063d41b9da23d098dc05"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0dfe742e246e607fcf1d6e2ce5"`);
        await queryRunner.query(`DROP TABLE "super_admin_groups"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d3350b241c18272b9893850068"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1b8cbc12a962d9432360be3600"`);
        await queryRunner.query(`DROP TABLE "super_admin_roles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a08e722fdfa6ded6ef39e7df34"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_93106d250b236116f9ccfc4a46"`);
        await queryRunner.query(`DROP TABLE "super_role_permissions"`);
        await queryRunner.query(`DROP TABLE "personal_access_token"`);
        await queryRunner.query(`DROP TYPE "public"."personal_access_token_token_type_enum"`);
        await queryRunner.query(`DROP TABLE "notification_jobs"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_user_type_enum"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TABLE "super_group"`);
        await queryRunner.query(`DROP TABLE "superadmins"`);
        await queryRunner.query(`DROP TABLE "logging"`);
        await queryRunner.query(`DROP TABLE "super_roles"`);
        await queryRunner.query(`DROP TABLE "super_permissions"`);
    }

}
