import { MigrationInterface, QueryRunner } from "typeorm";

export class Phase3Fixes1784267780170 implements MigrationInterface {
    name = 'Phase3Fixes1784267780170'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bank_ifsc"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "bank_ifsc" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bank_ifsc"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "bank_ifsc" character varying(20)`);
    }

}
