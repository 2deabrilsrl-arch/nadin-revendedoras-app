<#
  Puente App Revendedoras -> Dragonfish (corre en la Servidora)
  ------------------------------------------------------------
  1. Pide a la app las consolidaciones que esperan remito.
  2. Se asegura de que la revendedora exista como cliente (código = DNI, o CUIT sin el verificador).
  3. Genera el Remito (o Pedido) en la REST API local de Dragonfish.
  4. Le informa a la app el número de comprobante (o el error).

  No abre puertos: solo hace pedidos salientes a la app (https) y a localhost:8008.
  Configuración en config.json (ver config.example.json). Log en logs\bridge-AAAAMMDD.log

  Para ver cómo está cargado un cliente en Dragonfish:  .\bridge.ps1 -VerCliente 30401574
  Para ver el stock de un artículo:                     .\bridge.ps1 -VerStock AC-5051
#>
param([string]$VerCliente, [string]$VerStock)

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
  # Verificados en Dragonfish: 1 = Responsable Inscripto, 7 = Responsable Monotributo
  if (($null -eq $v -or "$v" -eq '') -and $sit -eq 'RI') { $v = 1 }
  if (($null -eq $v -or "$v" -eq '') -and $sit -eq 'MONO') { $v = 7 }
  if ($null -eq $v -or "$v" -eq '') {
    throw "Falta en config.json 'SituacionFiscal$sit' (el número de esa situación fiscal en Dragonfish)"
  }
  return [int]$v
}

# Stock actual en Dragonfish de un artículo: devuelve @{ "COLOR|TALLE" = stock }
function Get-StockArticulo($dfs, $articulo) {
  $q = [uri]::EscapeDataString($articulo)
  $url = "$($dfs.Url)/ConsultaStockYPrecios/?query=$q&exacto=true&stockcero=true&limit=500"
  $res = Invoke-Json 'GET' $url $dfs.Headers $null
  $mapa = @{}
  foreach ($r in @($res.Resultados)) {
    if ((("" + $r.Articulo).Trim()).ToUpper() -ne $articulo.Trim().ToUpper()) { continue }
    $k = (("" + $r.Color).Trim() + '|' + ("" + $r.Talle).Trim()).ToUpper()
    $mapa[$k] = [double]$r.Stock
  }
  return $mapa
}

# Saca del remito lo que no tiene stock (Dragonfish no deja vender en negativo).
# Devuelve @{ Lineas = <las que van>; Faltantes = <lo que no hay> }
function Ajustar-PorStock($dfs, $lineas, $ref) {
  $stockPorArt = @{}
  $van = @(); $faltan = @()
  foreach ($l in $lineas) {
    $art = "" + $l.articulo
    if (-not $stockPorArt.ContainsKey($art)) {
      try { $stockPorArt[$art] = Get-StockArticulo $dfs $art }
      catch { Log "[$ref] no pude consultar stock de $($art): $(Get-ErrorBody $_)"; $stockPorArt[$art] = $null }
    }
    $mapa = $stockPorArt[$art]
    $k = (("" + $l.color).Trim() + '|' + ("" + $l.talle).Trim()).ToUpper()
    $pedida = [double]$l.cantidad
    if ($null -eq $mapa -or -not $mapa.ContainsKey($k)) {
      # Sin dato de stock: se manda igual y decide Dragonfish
      $van += $l; continue
    }
    $hay = [Math]::Floor([Math]::Max(0, $mapa[$k]))
    $enviar = [Math]::Min($pedida, $hay)
    $mapa[$k] = $mapa[$k] - $enviar   # por si el mismo artículo aparece dos veces
    if ($enviar -lt $pedida) {
      $faltan += @{ sku = $l.sku; nombre = "$($l.nombre) $($l.color) $($l.talle)".Trim(); pedida = $pedida; enviada = $enviar }
      Log "[$ref] sin stock suficiente: $($l.sku) pedida $pedida, hay $hay"
    }
    if ($enviar -gt 0) {
      $copia = @{}; foreach ($p in $l.PSObject.Properties) { $copia[$p.Name] = $p.Value }
      $copia.cantidad = $enviar
      $van += [pscustomobject]$copia
    }
  }
  return @{ Lineas = $van; Faltantes = $faltan }
}

if ($VerStock) {
  $dfs = Get-DfSession
  $m = Get-StockArticulo $dfs $VerStock
  if ($m.Count -eq 0) { Write-Host "Dragonfish no devolvió stock para $VerStock" }
  $m.GetEnumerator() | Sort-Object Name | ForEach-Object { "{0,-20} {1}" -f $_.Name, $_.Value }
  exit 0
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
function Informar($id, $ok, $comprobante, $errorMsg, $definitivo, $extra) {
  $body = @{ id = $id; ok = $ok; comprobante = $comprobante; error = $errorMsg; definitivo = [bool]$definitivo }
  if ($extra) { foreach ($k in $extra.Keys) { $body[$k] = $extra[$k] } }
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
        $fGuardados = $null
        if ($Enviados.ContainsKey("$($c.id):faltantes")) { $fGuardados = @{ faltantes = @(("" + $Enviados["$($c.id):faltantes"]) | ConvertFrom-Json) } }
        Informar $c.id $true $Enviados[$c.id] $null $false $fGuardados
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

      # Qué código de cliente usar (regla Nadin: el código es el DNI; si no tiene, el CUIT)
      #  - Si Nadin le cargó un código de Dragonfish (clientes viejos), se usa ese y no se crea nada.
      #  - Si no, se busca en este orden: DNI del perfil -> DNI dentro del CUIT -> primeros 10 del CUIT.
      #  - Si no existe con ninguno, se crea: persona = DNI; empresa (CUIT 30/33/34) = primeros 10 del CUIT.
      $codFijo = ("" + $rev.codigoDragonfish).Trim()
      $usaCuit = ($sit -ne 'CF')
      $dniValido = ($dni -and [int64]$dni -ge 100000)   # descarta DNI vacíos o de relleno (00000002)
      if ($usaCuit -and $cuit.Length -ne 11 -and -not $codFijo) {
        $msg = "La revendedora $($rev.name) es $sit pero no tiene un CUIT válido cargado. Que lo complete en su perfil y reintentá."
        Log "[$($c.referencia)] ERROR $msg"
        if (-not $Cfg.DryRun) { Informar $c.id $false $null $msg $true }
        continue
      }
      if (-not $usaCuit -and -not $dniValido -and -not $codFijo) {
        $msg = "La revendedora $($rev.name) tiene un DNI inválido ('$($rev.dni)'). Corregilo en la app y reintentá."
        Log "[$($c.referencia)] ERROR $msg"
        if (-not $Cfg.DryRun) { Informar $c.id $false $null $msg $true }
        continue
      }

      $candidatos = @()
      if ($codFijo) {
        $candidatos = @($codFijo)
        $codCliente = $codFijo
      }
      else {
        $dniCorto = if ($dniValido) { $dni.Substring(0, [Math]::Min(10, $dni.Length)) } else { $null }
        $esEmpresa = $false; $dniDeCuit = $null; $cuit10 = $null
        if ($cuit.Length -eq 11) {
          $esEmpresa = @('30', '33', '34') -contains $cuit.Substring(0, 2)
          $dniDeCuit = ($cuit.Substring(2, 8)).TrimStart('0')
          $cuit10 = $cuit.Substring(0, 10)
        }
        foreach ($x in @($dniCorto, $(if (-not $esEmpresa) { $dniDeCuit }), $cuit10)) {
          if ($x -and -not ($candidatos -contains $x)) { $candidatos += $x }
        }
        # Código con el que se crearía si no existe
        $codCliente = if ($esEmpresa) { $cuit10 } elseif ($dniCorto) { $dniCorto } elseif ($dniDeCuit) { $dniDeCuit } else { $cuit10 }
      }

      # Cliente: existe solo si Dragonfish devuelve ESE código (algunas versiones responden 200 vacío)
      $existe = $false
      foreach ($cand in $candidatos) {
        try {
          $cliDf = Invoke-Json 'GET' "$Df/Cliente/$cand/" $DfHeaders $null
          if ($cliDf -and $cliDf.Codigo -and (("" + $cliDf.Codigo).Trim() -eq $cand)) {
            $existe = $true
            $codCliente = $cand
            Log "[$($c.referencia)] cliente $cand encontrado: $($cliDf.Nombre)"
            break
          }
        }
        catch { if (-not ((Get-ErrorBody $_) -match '(HTTP 40[04]|\b40[04]\b)')) { throw } }
      }
      if (-not $existe) { Log "[$($c.referencia)] no está con ninguno de estos códigos: $($candidatos -join ', ')" }
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
          # Así lo guarda Dragonfish (verificado con un cliente RI): CUIT sin guiones y razón social en Nombre y PrimerNombre
          $base.CUIT = $cuit
          $base.CUITDocumento = $cuit
          $razon = (("" + $(if ($rev.razonSocial) { $rev.razonSocial } else { $rev.name })).Trim())
          $base.Nombre = $razon
          $base.PrimerNombre = $razon
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

      # Stock: lo que no hay se saca del remito y se le avisa a la revendedora (no se frena todo el envío)
      $lineasEnviar = @($c.lineas)
      $faltantes = @()
      if ($Cfg.ValidarStock -ne $false) {
        $aj = Ajustar-PorStock $dfs $lineasEnviar $c.referencia
        $lineasEnviar = @($aj.Lineas); $faltantes = @($aj.Faltantes)
      }
      if ($lineasEnviar.Count -eq 0) {
        $msg = "Sin stock de ningún producto del envío"
        Log "[$($c.referencia)] $msg"
        if (-not $Cfg.DryRun) { Informar $c.id $false $null $msg $true @{ sinStock = $true; faltantes = $faltantes } }
        continue
      }

      $endpoint = if ($Cfg.Comprobante -eq 'Pedido') { 'Pedido' } else { 'Remito' }
      $motivo = if ($Cfg.Motivo) { "" + $Cfg.Motivo } else { 'APP' }   # sin motivo Dragonfish no graba
      $r = $null
      for ($intento = 1; $intento -le 2 -and -not $r; $intento++) {
        $detalle = @()
        foreach ($l in $lineasEnviar) {
          $detalle += @{ Articulo = $l.articulo; Color = $l.color; Talle = $l.talle; Cantidad = [double]$l.cantidad; Precio = [double]$l.precio }
        }
        $obs = "App Revendedoras $($c.referencia) | Pago: $($c.formaPago) | Entrega: $($c.tipoEnvio)"
        if ($c.transporte) { $obs += " ($($c.transporte))" }
        if ($faltantes.Count) { $obs += " | Sin stock: $($faltantes.Count)" }
        $comp = @{
          Cliente = $codCliente
          Motivo = $motivo
          ListaDePrecios = $Cfg.ListaDePrecios
          NroOPEcommerce = $c.referencia
          Obs = $obs.Substring(0, [Math]::Min(250, $obs.Length))
          FacturaDetalle = $detalle
        }
        if ($Cfg.Vendedor) { $comp.Vendedor = $Cfg.Vendedor }

        if ($Cfg.DryRun) {
          Log "[$($c.referencia)] (prueba) generaría $endpoint con $($detalle.Count) líneas, $($faltantes.Count) sin stock: $($comp | ConvertTo-Json -Depth 6 -Compress)"
          break
        }
        try { $r = Invoke-Json 'POST' "$Df/$endpoint/" $DfHeaders $comp }
        catch {
          $err = Get-ErrorBody $_
          # Se vendió en el salón justo en el medio: se vuelve a mirar el stock y se reintenta una vez
          if ($intento -eq 1 -and $err -match '(?i)stock') {
            Log "[$($c.referencia)] Dragonfish rechazó por stock, reviso de nuevo: $err"
            $aj = Ajustar-PorStock $dfs @($c.lineas) $c.referencia
            $lineasEnviar = @($aj.Lineas); $faltantes = @($aj.Faltantes)
            if ($lineasEnviar.Count -eq 0) { break }
            continue
          }
          throw
        }
      }
      if ($Cfg.DryRun) { continue }
      if (-not $r) {
        $msg = "Sin stock de ningún producto del envío"
        Log "[$($c.referencia)] $msg"
        Informar $c.id $false $null $msg $true @{ sinStock = $true; faltantes = $faltantes }
        continue
      }

      # "R 0001-00030704" (la letra solo si es distinta de la inicial del comprobante)
      $ini = $endpoint.Substring(0,1)
      $letra = if ($r.Letra -and ("" + $r.Letra).Trim() -ne $ini) { "$($r.Letra) " } else { '' }
      $numero = "{0} {1}{2:0000}-{3:00000000}" -f $ini, $letra, [int]$r.PuntoDeVenta, [int]$r.Numero
      $Enviados[$c.id] = $numero
      if ($faltantes.Count) { $Enviados["$($c.id):faltantes"] = ($faltantes | ConvertTo-Json -Compress -Depth 4) }
      Guardar-Enviados
      Informar $c.id $true $numero $null $false @{ faltantes = $faltantes }
      Log "[$($c.referencia)] OK $endpoint $numero ($($detalle.Count) líneas, $($faltantes.Count) sin stock)"
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
