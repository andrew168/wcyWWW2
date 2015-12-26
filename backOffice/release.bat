set src=E:\projects\eCardCore\backOffice
set dst=E:\projects\cardforvote\backOffice
md dst
xcopy %src%\*.*   %dst% /s/e/v/y
rem 发布了 server 到 %dst%

