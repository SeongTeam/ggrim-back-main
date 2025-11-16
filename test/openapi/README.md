### DTO type definition

- API DTO doc is created by `@nestjs/swagger` plugin
- To validate API DTO doc, use `openapi-typescript` to generate API code from OpenAPI doc

- below cmd generate DTO type, path, params, query from Open API Doc created by swagger
```
npx openapi-typescript http://localhost:3000/api-json -o test/openapi/dto-types.ts --enum --dedupe-enums --export-type --root-types --root-types-no-schema-prefix --make-paths-enum --generate-path-params
```

- [option info](https://openapi-ts.dev/cli#flags)

### DB Constraint Error

- sometime, data seeding not satisfy DB constraint
- you can find out which column or table occur error.

```SQL
SELECT c.conname,
       t.relname AS table_name,
       a.attname AS column_name
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_attribute a ON a.attrelid = t.oid
                   AND a.attnum = ANY (c.conkey)
WHERE c.conname = 'UQ_a11074d21d264b5a66c0e90fd19';
```