# Crea una tarea programada que ejecuta el puente cada 2 minutos (correr como Administrador)
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Script = Join-Path $Here 'bridge.ps1'
$Accion = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$Script`"" -WorkingDirectory $Here
$Disparador = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 2)
$Config = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
Register-ScheduledTask -TaskName 'Nadin - Puente Dragonfish' -Action $Accion -Trigger $Disparador -Settings $Config -User 'SYSTEM' -RunLevel Highest -Force
Write-Host 'Listo: la tarea "Nadin - Puente Dragonfish" corre cada 2 minutos.'
