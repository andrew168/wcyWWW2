set src=E:\projects\eCardCore\backOffice
set dst=E:\projects\cardforvote\backOffice
md dst
xcopy %src%\*.*   %dst% /s/e/v/y
rem published server to %dst%
