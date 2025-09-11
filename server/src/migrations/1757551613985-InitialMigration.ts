import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1757551613985 implements MigrationInterface {
    name = 'InitialMigration1757551613985'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable uuid-ossp extension for UUID generation (must be done before using uuid_generate_v4())
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "username" character varying(50) NOT NULL,
                "email" character varying(255) NOT NULL,
                "password" character varying NOT NULL,
                "level" integer NOT NULL DEFAULT '0',
                "experience" integer NOT NULL DEFAULT '0',
                "totalMatches" integer NOT NULL DEFAULT '0',
                "totalWins" integer NOT NULL DEFAULT '0',
                "totalKills" integer NOT NULL DEFAULT '0',
                "totalDeaths" integer NOT NULL DEFAULT '0',
                "totalScore" integer NOT NULL DEFAULT '0',
                "totalPlayTime" integer NOT NULL DEFAULT '0',
                "isActive" boolean NOT NULL DEFAULT true,
                "lastLoginAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_96aac72f1574b88752e9fb00089" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for users table
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email")
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "users" ("username")
        `);

        // Create game_rooms table
        await queryRunner.query(`
            CREATE TABLE "game_rooms" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "maxPlayers" integer NOT NULL DEFAULT '8',
                "currentPlayers" integer NOT NULL DEFAULT '0',
                "status" character varying NOT NULL DEFAULT 'waiting',
                "gameMode" character varying NOT NULL DEFAULT 'classic',
                "isPrivate" boolean NOT NULL DEFAULT false,
                "password" character varying,
                "settings" jsonb,
                "createdBy" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_9e22d6e459c67a16c5e21c843d7" PRIMARY KEY ("id")
            )
        `);

        // Create matches table
        await queryRunner.query(`
            CREATE TABLE "matches" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "gameRoomId" uuid NOT NULL,
                "winnerId" uuid,
                "status" character varying NOT NULL DEFAULT 'in_progress',
                "startTime" TIMESTAMP NOT NULL,
                "endTime" TIMESTAMP,
                "duration" integer,
                "settings" jsonb,
                "statistics" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_8c56ff4d1e38b6d97047477640f" PRIMARY KEY ("id")
            )
        `);

        // Create rankings table
        await queryRunner.query(`
            CREATE TABLE "rankings" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "season" character varying NOT NULL,
                "rank" integer NOT NULL,
                "rating" integer NOT NULL DEFAULT '1000',
                "wins" integer NOT NULL DEFAULT '0',
                "losses" integer NOT NULL DEFAULT '0',
                "winRate" numeric(5,2) NOT NULL DEFAULT '0',
                "bestRank" integer,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_8c56ff4d1e38b6d97047477640e" PRIMARY KEY ("id")
            )
        `);

        // Create foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "game_rooms"
            ADD CONSTRAINT "FK_4c88e956195bba85977da21b8f4"
            FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "matches"
            ADD CONSTRAINT "FK_3f8c6493e2a1b4c5e6f7g8h9i0j"
            FOREIGN KEY ("gameRoomId") REFERENCES "game_rooms"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "matches"
            ADD CONSTRAINT "FK_4k5l6m7n8o9p0q1r2s3t4u5v6"
            FOREIGN KEY ("winnerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "rankings"
            ADD CONSTRAINT "FK_5w6x7y8z9a0b1c2d3e4f5g6h7"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "rankings" DROP CONSTRAINT "FK_5w6x7y8z9a0b1c2d3e4f5g6h7"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_4k5l6m7n8o9p0q1r2s3t4u5v6"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_3f8c6493e2a1b4c5e6f7g8h9i0j"`);
        await queryRunner.query(`ALTER TABLE "game_rooms" DROP CONSTRAINT "FK_4c88e956195bba85977da21b8f4"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "rankings"`);
        await queryRunner.query(`DROP TABLE "matches"`);
        await queryRunner.query(`DROP TABLE "game_rooms"`);
        await queryRunner.query(`DROP TABLE "users"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_fe0bb3f6520ee0469504521e71"`);
        await queryRunner.query(`DROP INDEX "IDX_97672ac88f789774dd47f7c8be"`);
    }
}
