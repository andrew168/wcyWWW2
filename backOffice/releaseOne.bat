set src=\proj\WcyCore2
set dst=\proj\udoido3\%1

md dst
xcopy %src%\backOffice\*.*   %dst% /EXCLUDE:%src%\excludefiles.txt /s/e/v/y
rem published server to %dst%
