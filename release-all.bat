call release-backOffice-only.bat
call release-wcylib-only.bat
set src=E:\projects\WcyCore
set dst=E:\projects\cardforvote

copy %src%\start.bat   %dst%
copy %src%\db-start.bat   %dst%
rem published server to %dst%
pause
