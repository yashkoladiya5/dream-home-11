# Database Migrations

## Generating a Migration

After making changes to entities, generate a migration file:

```bash
npm run migration:generate -- src/migrations/AddColumnName
```

This will create a new timestamped migration file in `src/migrations/`.

## Running Migrations

Apply all pending migrations:

```bash
npm run migration:run
```

## Reverting Migrations

Revert the last batch of migrations:

```bash
npm run migration:revert
```

## Notes

- Always test migrations on a staging environment before running on production.
- Migration files are compiled to `dist/migrations/` before execution.
- The `typeorm_migrations` table tracks which migrations have been applied.
- Never edit existing migration files that have already been applied to production.
- For initial schema setup, use the `InitialSchema` migration class if tables don't exist yet.
