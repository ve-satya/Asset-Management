# Run as Administrator — enables SQL Server TCP/IP and restarts the service
$regPath = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL15.MSSQLSERVER\MSSQLServer\SuperSocketNetLib\Tcp"
try {
    Set-ItemProperty -Path $regPath -Name "Enabled" -Value 1 -ErrorAction Stop
    Write-Host "TCP/IP enabled in registry."
} catch {
    Write-Warning "Registry write failed: $_"
}

# Restart SQL Server so the protocol change takes effect
try {
    Restart-Service -Name "MSSQLSERVER" -Force -ErrorAction Stop
    Write-Host "SQL Server service restarted."
} catch {
    Write-Warning "Service restart failed: $_"
}
Write-Host "Done. Press any key to exit."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
