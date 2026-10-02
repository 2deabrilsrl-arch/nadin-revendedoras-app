# Puente App Revendedoras → Dragonfish

Corre en la **Servidora** (donde está Dragonfish y su REST API en `localhost:8008`).
Cada 2 minutos toma las consolidaciones nuevas de la app y genera el **Remito** en Dragonfish.

- Cliente Dragonfish = DNI de la revendedora (igual que la integración con Tiendanube). Si no existe, se crea.
- Artículo / color / talle salen del SKU de Tiendanube (`ARTICULO#COLOR#TALLE`).
- Precio = precio mayorista del momento del pedido. Lista de precios configurable (`LISTA1`).
- Motivo del comprobante: `APP` (obligatorio en Dragonfish, configurable con `Motivo`).
- En `Obs` queda la referencia `APP-XXXXXXXX`, la forma de pago y la entrega.
- `enviados.json` evita remitos duplicados si se corta internet justo después de generar.
- `DryRun: true` = modo prueba: no crea nada, solo escribe en `logs\` lo que haría.

Archivos: `bridge.ps1` (el puente), `config.json` (claves — NO subir a GitHub), `instalar-tarea.ps1`.
