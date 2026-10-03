<#
  Puente App Revendedoras -> Dragonfish (corre en la Servidora)
  ------------------------------------------------------------
  1. Pide a la app las consolidaciones que esperan remito.
  2. Se asegura de que la revendedora exista como cliente (código = DNI, o CUIT sin el verificador).
  3. Genera el Remito (o Pedido) en la REST API local de Dragonfish.
  4. Le informa a la app el número de comprobante (o el error).

  No abre puertos: solo hace pedidos salientes a la app (https) y a localhost:8008.
  Configuración en config.json (ver config.example.json). Log en logs\bridge-AAAAMMDD.log

  Para ver cómo está cargado un cliente en Dragonfish:  .\bridge.ps1 -VerCliente 0000000357
#>
param([string]$VerCliente)

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

function Get-DfSession {
  $df = "$($Cfg.DfUrl.TrimEnd('/'))/api.Dragonfish"
  Invoke-Json 'POST' "$df/Autenticar" @{} @{ IdCliente = $Cfg.DfIdCliente; JWToken = $Cfg.DfToken } | Out-Null
  return @{ Url = $df; Headers = @{ IdCliente = $Cfg.DfIdCliente; Authorization = $Cfg.DfToken; BaseDeDatos = $Cfg.DfBaseDeDatos } }
}

# Separa "Maria Laura Gomez" en nombres y apellido (la última palabra es el apellido)
function Split-Nombre($full) {
  $partes = @((("" + $full).Trim() -split '\s+') | Where-Object { $_ })
  if ($partes.Count -le 1) { return @{ Primer = ("" + $full).Trim(); Segundo = ''; Apellido = '' } }
  $ape = $partes[-1]
  $noms = $partes[0..($partes.Count - 2)]
  return @{ Primer = $noms[0]; Segundo = (($noms | Select-Object -Skip 1) -join ' '); Apellido = $ape }
}

# Situación fiscal y tipo de documento para Consumidor Final con DNI:
# se toman del config o se copian de un cliente "plantilla" ya cargado así en Dragonfish
$script:FiscalCF = $null
function Get-FiscalCF($dfs) {
  if ($script:FiscalCF) { return $script:FiscalCF }
  $sf = $Cfg.SituacionFiscalCF; $td = $Cfg.TipoDocumentoDNI
  if ((-not $sf -or -not $td) -and $Cfg.ClientePlantilla) {
    $p = Invoke-Json 'GET' "$($dfs.Url)/Cliente/$($Cfg.ClientePlantilla)/" $dfs.Headers $null
    if (-not $p -or -not $p.Codigo) { throw "No encontré el cliente plantilla $($Cfg.ClientePlantilla) en Dragonfish" }
    if (-not $sf) { $sf = $p.SituacionFiscal }
    if (-not $td) { $td = $p.TipoDocumento }
    Log "Plantilla $($Cfg.ClientePlantilla) ($($p.Nombre)): SituacionFiscal=$sf TipoDocumento=$td"
  }
  # Valores de Dragonfish (verificados con un cliente real): 3 = Consumidor Final, "05" = D.N.I.
  if (-not $sf) { $sf = 3 }
  if (-not $td) { $td = '05' }
  $script:FiscalCF = @{ SituacionFiscal = [int]$sf; TipoDocumento = ("" + $td) }
  return $script:FiscalCF
}

# Situación fiscal para clientas con CUIT. Los números salen de Dragonfish (ver un cliente con -VerCliente)
# y se cargan en config.json: "SituacionFiscalRI", "SituacionFiscalMONO", "SituacionFiscalEXENTO"
function Get-SituacionCuit($sit) {
  $v = $Cfg."SituacionFiscal$sit"
  if ($null -eq $v -or "$v" -eq '') {
    throw "Falta en config.json 'SituacionFiscal$sit' (el número de esa situación fiscal en Dragonfish)"
  }
  return [int]$v
}

if ($VerCliente) {
  $dfs = Get-DfSession
  Invoke-Json 'GET' "$($dfs.Url)/Cliente/$VerCliente/" $dfs.Headers $null | ConvertTo-Json -Depth 6
  exit 0
}

# Evita dos ejecuciones al mismo tiempo
$Lock = Join-Path $Here 'bridge.lock'
if ((Test-Path $Lock) -and ((Get-Date) - (Get-Item $Lock).LastWriteTime).TotalMinutes -lt 10) { exit 0 }
Set-Content -Path $Lock -Value $PID

# Registro local de lo ya generado (si la app no recibió el aviso, no se duplica el remito)
$Enviados = @{}
if (Test-Path $SentFile) {
  (Get-Content $SentFile -Raw -Encoding UTF8 | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $Enviados[$_.Name] = $_.Value }
}
function Guardar-Enviados { $Enviados | ConvertTo-Json | Set-Content -Path $SentFile -Encoding UTF8 }

$AppHeaders = @{ Authorization = "Bearer $($Cfg.BridgeSecret)" }
# Las URLs de prueba de Vercel están protegidas: este header deja pasar al puente
if ($Cfg.VercelBypass) { $AppHeaders['x-vercel-protection-bypass'] = "" + $Cfg.VercelBypass }
function Informar($id, $ok, $comprobante, $errorMsg, $definitivo) {
  $body = @{ id = $id; ok = $ok; comprobante = $comprobante; error = $errorMsg; definitivo = [bool]$definitivo }
  Invoke-Json 'POST' "$($Cfg.AppUrl)/api/dragonfish/resultado" $AppHeaders $body | Out-Null
}

try {
  $cola = Invoke-Json 'GET' "$($Cfg.AppUrl)/api/dragonfish/pendientes" $AppHeaders $null
  $lista = @($cola.consolidaciones)
  if ($lista.Count -eq 0) { Remove-Item $Lock -ErrorAction SilentlyContinue; exit 0 }
  Log "Pendientes: $($lista.Count)"

  $dfs = Get-DfSession
  $Df = $dfs.Url
  $DfHeaders = $dfs.Headers

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

      $rev = $c.revendedora
      $sit = if ($rev.situacionFiscal) { ("" + $rev.situacionFiscal).ToUpper() } else { 'CF' }
      $cuit = ("" + $rev.cuit) -replace '\D', ''
      $dni = ("" + $rev.dni) -replace '\D', ''

      # Qué código de cliente usar (regla Nadin: código = DNI o CUIT)
      #  1) Si Nadin le cargó un código de Dragonfish (clientes viejos), se usa ese y no se crea nada.
      #  2) Monotributo / Resp. Inscripto / Exento: los primeros 10 números del CUIT (sin el verificador).
      #  3) Consumidor Final: el DNI.
      $codFijo = ("" + $rev.codigoDragonfish).Trim()
      $usaCuit = ($sit -ne 'CF')
      if ($codFijo) {
        $codCliente = $codFijo
      }
      elseif ($usaCuit) {
        if ($cuit.Length -ne 11) {
          $msg = "La revendedora $($rev.name) es $sit pero no tiene un CUIT válido cargado. Que lo complete en su perfil y reintentá."
          Log "[$($c.referencia)] ERROR $msg"
          if (-not $Cfg.DryRun) { Informar $c.id $false $null $msg $true }
          continue
        }
        $codCliente = $cuit.Substring(0, 10)
      }
      else {
        # DNI vacío o de relleno (00000002, 12345...) = no se puede usar como cliente
        if (-not $dni -or [int64]$dni -lt 100000) {
          $msg = "La revendedora $($rev.name) tiene un DNI inválido ('$($rev.dni)'). Corregilo en la app y reintentá."
          Log "[$($c.referencia)] ERROR $msg"
          if (-not $Cfg.DryRun) { Informar $c.id $false $null $msg $true }
          continue
        }
        $codCliente = $dni.Substring(0, [Math]::Min(10, $dni.Length))
      }

      # Cliente: existe solo si Dragonfish devuelve ESE código (algunas versiones responden 200 vacío)
      $existe = $false
      try {
        $cliDf = Invoke-Json 'GET' "$Df/Cliente/$codCliente/" $DfHeaders $null
        if ($cliDf -and $cliDf.Codigo -and (("" + $cliDf.Codigo).Trim() -eq $codCliente)) {
          $existe = $true
          Log "[$($c.referencia)] cliente $codCliente encontrado: $($cliDf.Nombre)"
        }
      }
      catch { if (-not ((Get-ErrorBody $_) -match 'HTTP 40[04]')) { throw } }
      if (-not $existe) {
        if ($codFijo) { throw "El código de Dragonfish $codFijo cargado para $($rev.name) no existe" }
        if (-not $Cfg.CrearClientes) { throw "El cliente $codCliente no existe en Dragonfish" }
        $base = @{
          Codigo = $codCliente
          Pais = 'AR'
          EMail = $rev.email
          Movil = $rev.telefono
          ListaDePrecio = $Cfg.ListaDePrecios
        }
        if ($Cfg.Vendedor) { $base.Vendedor = $Cfg.Vendedor }
        if ($usaCuit) {
          # Monotributo / RI / Exento: CUIT con guiones (30-71825417-1) y razón social como nombre
          $sfCodigo = Get-SituacionCuit $sit
          $base.SituacionFiscal = $sfCodigo
          $base.CUIT = "{0}-{1}-{2}" -f $cuit.Substring(0, 2), $cuit.Substring(2, 8), $cuit.Substring(10, 1)
          $razon = if ($rev.razonSocial) { "" + $rev.razonSocial } else { "" + $rev.name }
          $base.Nombre = $razon.Trim()
        }
        else {
          # Consumidor Final con DNI -> el DNI va en Código y en Nro. de documento
          $fis = Get-FiscalCF $dfs
          $n = Split-Nombre $rev.name
          $base.SituacionFiscal = $fis.SituacionFiscal
          $base.TipoDocumento = $fis.TipoDocumento
          $base.NroDocumento = $codCliente
          $base.PrimerNombre = $n.Primer.ToUpper()
          $base.SegundoNombre = $n.Segundo.ToUpper()
          $base.Apellido = $n.Apellido.ToUpper()
          # Mismo formato que Dragonfish: "APELLIDO, NOMBRES"
          $base.Nombre = ($(if ($n.Apellido) { "$($n.Apellido), " } else { '' }) + ("$($n.Primer) $($n.Segundo)").Trim()).ToUpper()
        }
        if ($Cfg.DryRun) { Log "[$($c.referencia)] (prueba) crearía cliente: $($base | ConvertTo-Json -Compress)" }
        else {
          Invoke-Json 'POST' "$Df/Cliente/" $DfHeaders $base | Out-Null
          $chk = Invoke-Json 'GET' "$Df/Cliente/$codCliente/" $DfHeaders $null
          if (-not $chk -or (("" + $chk.Codigo).Trim() -ne $codCliente)) { throw "Dragonfish no devolvió el cliente $codCliente después de crearlo" }
          Log "[$($c.referencia)] cliente $codCliente creado: $($chk.Nombre) (SF=$($chk.SituacionFiscal) Doc=$($chk.TipoDocumento) $($chk.NroDocumento) CUIT=$($chk.CUIT))"
        }
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
      # "R 0001-00030704" (la letra solo si es distinta de la inicial del comprobante)
      $ini = $endpoint.Substring(0,1)
      $letra = if ($r.Letra -and ("" + $r.Letra).Trim() -ne $ini) { "$($r.Letra) " } else { '' }
      $numero = "{0} {1}{2:0000}-{3:00000000}" -f $ini, $letra, [int]$r.PuntoDeVenta, [int]$r.Numero
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
