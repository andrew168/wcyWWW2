set src=E:\projects\WcyCore\backOffice
set dst=E:\projects\cardforvote\%1
md dst
xcopy %src%\*.*   %dst% /EXCLUDE:E:\projects\WcyCore\excludefiles.txt /s/e/v/y
rem published server to %dst%
