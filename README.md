# main

# Запуск менеджера пакетов pm2

### Запуск всех сервисов
```shell
pm2 start ecosystem.config.js
```
###### Удаление продакшена из менеджера
```shell
pm2 delete "web-app production"
```
### Статичная версия сайта (продакшн)
```shell
cd .\web-client\
```
```shell
npm run build
```
```shell
cd ..\
```
```shell
pm2 start ecosystem.config.js --only "web-app production"
```