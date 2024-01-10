# main/api

Пароль test от базовых аккаунтов из файла seed: ilya, ivan, petr

## Запуск dev

```shell
npm install
```

```shell
npm run dev
```


## Prisma

Сгенерировать конфиг для базы(после npm install и после изменения названия пароля адреса бд) 
```shell
npx prisma generate --schema=./prisma/schema.prisma
```

После изменении/создании модели нужно написать

```shell
npx prisma migrate dev
```

Запись в БД первоначальных данных из файла seed.js
```shell
npx prisma db seed
```
Запуск Prisma studio
```shell
npx prisma studio
```