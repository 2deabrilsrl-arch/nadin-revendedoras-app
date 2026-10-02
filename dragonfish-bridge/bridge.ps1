<#
  Puente App Revendedoras -> Dragonfish (corre en la Servidora)
  ------------------------------------------------------------
  1. Pide a la app las consolidaciones que esperan remito.
  2. Se asegura de que la revendedora exista como cliente (código = DNI).
  3. Genera el Remito (o Pedido) en la REST API local de Dragonfish.
  4. Le informa a la app el número de comprobante (o el error).

  No abre puertos: solo hace pedidos salientes a la app (https) y a localhost:8008.
  Configuración en config.json (ver config.example.json). Log en logs\bridge-AAAAMMDD.log
#>

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$Cfg = Get-Content (Join-Path $Here 'config.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$LogDir = Join-Path $Here 'logs'
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }
$LogFile = Join-Path $LogDir ("bridge-{0}.log" -f (Get-Date -Format 'yyyyMMdd'))
$SentFile = Join-Path $Here 'enviados.json'

function Log($msg) {
  $line = "{0}  {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
  Add-Content -Path $LogFile -Value $line -Encoding UTF8
  Write-Host $line
}

# Evita dos ejecuciones al mismo tiempo
$Lock = Join-Path $Here 'bridge.lock'
if ((Test-Path $Lock) -and ((Get-Date) - (Get-Item $Lock).LastWriteTime).TotalMinutes -lt 10) { exit 0 }
Set-Content -Path $Lock -Value $PID

function Get-ErrorBody($err) {
  try {
    $resp = $err.Exception.Response
    if ($resp) {
      $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
      return "HTTP $([int]$resp.StatusCode): " + $reader.ReadToEnd()
    }
  } catch {}
  return $err.Exception.Message
}

function Invoke-Json($method, $url, $headers, $body) {
  $params = @{ Method = $method; Uri = $url; Headers = $headers; ContentType = 'application/json; charset=utf-8'; UseBasicParsing = $true }
  if ($null -ne $body) { $params.Body = [System.Text.Encoding]::UTF8.GetBytes(($body | ConvertTo-Json -Depth 10)) }
  return Invoke-RestMethod @params
}

# Registro local de lo ya generado (si la app no recibió el aviso, no se duplica el remito)
$Enviados = @{}
if (Test-Path $SentFile) {
  (Get-Content $SentFile -Raw -Encoding UTF8 | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $Enviados[$_.Name] = $_.Value }
}
function Guardar-Enviados { $Enviados | ConvertTo-Json | Set-Content -Path $SentFile -Encoding UTF8 }

$AppHeaders = @{ Authorization = "Bearer $($Cfg.BridgeSecret)" }
function Informar($id, $ok, $comprobante, $errorMsg, $definitivo) {
  $body = @{ id = $id; ok = $ok; comprobante = $comprobante; error = $errorMsg; definitivo = [bool]$definitivo }
  Invoke-Json 'POST' "$($Cfg.AppUrl)/api/dragonfish/resultado" $AppHeaders $body | Out-Null
}

try {
  $cola = Invoke-Json 'GET' "$($Cfg.AppUrl)/api/dragonfish/pendientes" $AppHeaders $null
  $lista = @($cola.consolidaciones)
  if ($lista.Count -eq 0) { Remove-Item $Lock -ErrorAction SilentlyContinue; exit 0 }
  Log "Pendientes: $($lista.Count)"

  $Df = "$($Cfg.DfUrl.TrimEnd('/'))/api.Dragonfish"
  Invoke-Json 'POST' "$Df/Autenticar/" @{} @{ IdCliente = $Cfg.DfIdCliente; JWToken = $Cfg.DfToken } | Out-Null
  $DfHeaders = @{ IdCliente = $Cfg.DfIdCliente; Authorization = $Cfg.DfToken; BaseDeDatos = $Cfg.DfBaseDeDatos }

  foreach ($c in $lista) {
    try {
      # Ya generado en una corrida anterior: solo re-informamos
      if ($Enviados.ContainsKey($c.id)) {
        Informar $c.id $true $Enviados[$c.id] $null $false
        Log "[$($c.referencia)] ya estaba generado ($($Enviados[$c.id])), re-informado"
        continue
      }

      if (@($c.sinCodigo).Count -gt 0) {
        $msg = "Productos sin código Dragonfish (SKU ARTICULO#COLOR#TALLE): " + (@($c.sinCodigo) -join '; ')
        Log "[$($c.referencia)] ERROR $msg"
        if (-not $Cfg.DryRun) { Informar $c.id $false $null $msg $true }
        continue
      }

      $dni = ("" + $c.revendedora.dni) -replace '\D', ''
      if (-not $dni) { throw "La revendedora no tiene DNI cargado" }
      $codCliente = $dni.Substring(0, [Math]::Min(10, $dni.Length))

      # Cliente
      $existe = $true
      try { Invoke-Json 'GET' "$Df/Cliente/$codCliente/" $DfHeaders $null | Out-Null }
      catch { if ((Get-ErrorBody $_) -match 'HTTP 404') { $existe = $false } else { throw } }
      if (-not $existe) {
        if (-not $Cfg.CrearClientes) { throw "El cliente $codCliente no existe en Dragonfish" }
        $cli = @{
          Codigo = $codCliente
          Nombre = ("" + $c.revendedora.name).ToUpper()
          NroDocumento = $codCliente
          EMail = $c.revendedora.email
          Movil = $c.revendedora.telefono
          ListaDePrecio = $Cfg.ListaDePrecios
        }
        if ($Cfg.DryRun) { Log "[$($c.referencia)] (prueba) crearía cliente: $($cli | ConvertTo-Json -Compress)" }
        else { Invoke-Json 'POST' "$Df/Cliente/" $DfHeaders $cli | Out-Null; Log "[$($c.referencia)] cliente $codCliente creado" }
      }

      # Comprobante
      $detalle = @()
      foreach ($l in @($c.lineas)) {
        $detalle += @{ Articulo = $l.articulo; Color = $l.color; Talle = $l.talle; Cantidad = [double]$l.cantidad; Precio = [double]$l.precio }
      }
      $obs = "App Revendedoras $($c.referencia) | Pago: $($c.formaPago) | Entrega: $($c.tipoEnvio)"
      if ($c.transporte) { $obs += " ($($c.transporte))" }
      # Todo comprobante necesita un motivo cargado en Dragonfish (si no, no se graba)
      $motivo = if ($Cfg.Motivo) { "" + $Cfg.Motivo } else { 'APP' }
      $comp = @{
        Cliente = $codCliente
        Motivo = $motivo
        ListaDePrecios = $Cfg.ListaDePrecios
        NroOPEcommerce = $c.referencia
        Obs = $obs.Substring(0, [Math]::Min(250, $obs.Length))
        FacturaDetalle = $detalle
      }
      if ($Cfg.Vendedor) { $comp.Vendedor = $Cfg.Vendedor }

      $endpoint = if ($Cfg.Comprobante -eq 'Pedido') { 'Pedido' } else { 'Remito' }
      if ($Cfg.DryRun) {
        Log "[$($c.referencia)] (prueba) generaría $endpoint con $($detalle.Count) líneas: $($comp | ConvertTo-Json -Depth 6 -Compress)"
        continue
      }

      $r = Invoke-Json 'POST' "$Df/$endpoint/" $DfHeaders $comp
      $numero = "{0} {1}{2:0000}-{3:00000000}" -f ($endpoint.Substring(0,1)), ($(if ($r.Letra) { "$($r.Letra) " } else { '' })), [int]$r.PuntoDeVenta, [int]$r.Numero
      $Enviados[$c.id] = $numero
      Guardar-Enviados
      Informar $c.id $true $numero $null $false
      Log "[$($c.referencia)] OK $endpoint $numero ($($detalle.Count) líneas)"
    }
    catch {
      $msg = Get-ErrorBody $_
      Log "[$($c.referencia)] ERROR $msg"
      if (-not $Cfg.DryRun) { try { Informar $c.id $false $null $msg $false } catch { Log "No se pudo informar el error: $(Get-ErrorBody $_)" } }
    }
  }
}
catch {
  Log "ERROR general: $(Get-ErrorBody $_)"
}
finally {
  Remove-Item $Lock -ErrorAction SilentlyContinue
}
