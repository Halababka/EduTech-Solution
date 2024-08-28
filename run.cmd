@echo off

echo Starting API server...
cd api
start cmd /k npm run dev
cd..

echo Starting Notification server...  
cd Notification
start cmd /k npm run dev
cd..

echo Starting Web Client server...
cd web-client
start cmd /k npm run dev
cd..

echo All servers started!