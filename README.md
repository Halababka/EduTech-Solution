# main/api

## Запуск dev

```shell
npm install
```

```shell
npm run dev
```


## Prisma

После изменении/создании модели нужно написать

```shell
npx prisma migrate dev
```
Не помню зачем, но может потребоваться
```shell
npx prisma generate --schema=./prisma/schema.prisma
```


