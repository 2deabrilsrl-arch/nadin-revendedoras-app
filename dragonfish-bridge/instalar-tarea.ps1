# Crea una tarea programada que ejecuta el puente cada 2 minutos (correr como Administrador)
$ErrorActionPreference = 'Stop'
$esAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $esAdmin) {
  Write-Host 'Hay que correrlo como Administrador. Se abre una ventana nueva para confirmar...' -ForegroundColor Yellow
  Start-Process powershell -Verb RunAs -ArgumentList "-NoExit -NoProfile -ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`""
  exit
}
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Script = Join-Path $Here 'bridge.ps1'
$Accion = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$Script`"" -WorkingDirectory $Here
$Disparador = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 2)
$Config = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
Register-ScheduledTask -TaskName 'Nadin - Puente Dragonfish' -Action $Accion -Trigger $Disparador -Settings $Config -User 'SYSTEM' -RunLevel Highest -Force
Write-Host 'Listo: la tarea "Nadin - Puente Dragonfish" corre cada 2 minutos.' -ForegroundColor Green
Get-ScheduledTaskInfo -TaskName 'Nadin - Puente Dragonfish' | Format-List LastRunTime,LastTaskResult,NextRunTime
