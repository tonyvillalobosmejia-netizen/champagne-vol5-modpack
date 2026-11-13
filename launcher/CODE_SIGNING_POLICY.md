# Política de firma de código de VillaWolf

Actualizada el 16 de octubre de 2026.

## Estado real

La solicitud a SignPath Foundation pasó de enviada/pendiente a **rechazada**, según el correo citado en el registro previo del proyecto, por visibilidad/adopción insuficientes. Esta revisión documental no reabrió ese correo ni obtuvo una decisión nueva. No hay certificado ni servicio de firma concedido y no se anuncia una fecha.

Se consultó Authenticode de los instaladores públicos conservados localmente: Launcher 0.1.20, Administrador 0.1.26 y Bot 0.2.5; los tres devuelven **NotSigned**. El log de compilación «signing with signtool.exe» no prueba una firma efectiva. SHA-256/SHA-512 verifican integridad, no identifican un editor de confianza ni sustituyen Authenticode.

## Condiciones para una firma futura

Mantenedor: [tonyvillalobosmejia-netizen](https://github.com/tonyvillalobosmejia-netizen). El titular deberá revisar proveedor, elegibilidad, costes y autenticación/roles antes de conceder acceso. La propuesta previa de SignPath y de aprobador manual no constituye una concesión actual.

Sólo firmar construcciones del código propio revisado de este repositorio. No firmar Minecraft, Forge, Java, mods ni recursos ajenos como propios. No guardar claves privadas, certificados con contraseña o credenciales de firma en Git ni en paquetes.

Antes de distribuir una futura versión firmada: comprobar cadena/editor/Authenticode del EXE y del instalador finales; regenerar blockmap y metadatos desde los bytes finales; comprobar actualización y conservación de datos. No sobrescribir assets históricos para simular una firma.

No publicar «Free code signing provided by SignPath.io, certificate by SignPath Foundation» salvo admisión y servicio reales. Esa frase describe el programa inicialmente solicitado, no un respaldo recibido.

## Antecedentes y límites

La política anterior reflejaba una solicitud pendiente y mencionaba 0.1.8; quedó obsoleta. Se conserva su historia en Git y el estado de desarrollo. Revisar licencia de imágenes/materiales propios y privacidad antes de nuevas solicitudes. No recomendar saltarse advertencias de Windows ni desactivar protecciones para compensar la ausencia de firma.

[Privacidad](PRIVACY.md) · [Terceros](THIRD_PARTY_NOTICES.md) · [Estado del proyecto](ESTADO_DESARROLLO.md).

