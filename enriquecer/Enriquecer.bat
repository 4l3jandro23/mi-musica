@echo off
rem Rellena los datos de tus artistas y, si quieres, los sube a GitHub.
chcp 65001 >nul
cd /d "%~dp0\.."
if exist .git\rebase-merge goto rebase
if exist .git\rebase-apply goto rebase
set RAMA=
for /f %%b in ('git rev-parse --abbrev-ref HEAD') do set RAMA=%%b
if /i not "%RAMA%"=="main" (
  echo Estas en la rama "%RAMA%", no en main. Pidele a Claude que lo deje en main.
  goto fin
)
echo Trayendo lo ultimo de GitHub (por si has exportado la biblioteca)...
git pull --rebase --autostash
if errorlevel 1 (
  echo No he podido traer lo ultimo de GitHub. Sigo con lo que hay en el PC.
)
echo.
set PY=python
where py >nul 2>nul && set PY=py -3
%PY% enriquecer\enriquecer.py %*
if errorlevel 1 goto fin
echo.
choice /c SN /m "Subo los datos nuevos a GitHub para verlos en el movil"
if errorlevel 2 goto fin
git add -- artistas-info.json no-identificados.csv
git commit -m "datos de artistas" -- artistas-info.json no-identificados.csv
git pull --rebase --autostash
if errorlevel 1 (
  echo No he podido juntarlo con lo de GitHub. No subo nada. Pidele ayuda a Claude.
  goto fin
)
git push
if errorlevel 1 (
  echo No he podido subirlo a GitHub. Prueba otra vez luego.
  goto fin
)
echo Subido. En unos minutos lo veras en el movil.
goto fin
:rebase
echo Git esta a medias de una operacion anterior. No toco nada. Pidele ayuda a Claude.
:fin
echo.
pause
