set src=E:\Doc_qian2\WcyCore2\backOffice
set dst=E:\Doc_qian2\udoido2\%1

md dst
xcopy %src%\*.*   %dst% /EXCLUDE:E:\projects\WcyCore\excludefiles.txt /s/e/v/y
rem published server to %dst%
