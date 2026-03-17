import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUrlsTable1773775550970 implements MigrationInterface {
    name = 'CreateUrlsTable1773775550970'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "urls" ("id" SERIAL NOT NULL, "url" text NOT NULL, "shortCode" character varying NOT NULL, "accessCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_34ced802e4a45bf6a6346f2eb97" UNIQUE ("shortCode"), CONSTRAINT "PK_eaf7bec915960b26aa4988d73b0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ec198edcc54cc05ca0aad8d9b3" ON "urls" ("url") `);
        await queryRunner.query(`CREATE INDEX "IDX_34ced802e4a45bf6a6346f2eb9" ON "urls" ("shortCode") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_34ced802e4a45bf6a6346f2eb9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ec198edcc54cc05ca0aad8d9b3"`);
        await queryRunner.query(`DROP TABLE "urls"`);
    }

}
