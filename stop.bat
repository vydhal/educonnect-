@echo off
REM Stop EduConnect containers

echo.
echo 🛑 Parando EduConnect containers...
echo.

docker-compose down

echo.
echo ✅ Containers parados com sucesso!
echo.
pause
