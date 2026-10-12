# Code signing policy

Estado: VillaWolf Launcher está preparando una solicitud al programa gratuito de SignPath Foundation. La solicitud no se ha enviado y no se dispone de su firma. La versión publicada 0.1.8 no está firmada.

Mantenedor y revisor: [tonyvillalobosmejia-netizen](https://github.com/tonyvillalobosmejia-netizen). Aprobador propuesto de firmas: el mismo titular, quien deberá confirmar los roles y configurar la autenticación de dos factores exigida por el programa.

Las construcciones para firma deben proceder del código y scripts revisados de este repositorio. Cada solicitud de firma requiere aprobación manual del titular. No se firmarán archivos de Minecraft, Forge, Java, mods ni otros autores como propios.

Solo si SignPath admite el proyecto se anunciará: «Free code signing provided by SignPath.io, certificate by SignPath Foundation», con enlaces a [SignPath.io](https://signpath.io) y [SignPath Foundation](https://signpath.org). Esta frase describe el programa solicitado, no un servicio concedido actualmente. El certificado identifica a SignPath Foundation como editor.

Véase la [política de privacidad](PRIVACY.md) y los [avisos de terceros](THIRD_PARTY_NOTICES.md). Los permisos de los recursos gráficos y configuraciones se deben verificar antes de confirmar la elegibilidad completa.

Antes de una publicación firmada: verificar Authenticode del ejecutable y del instalador; generar blockmap y latest.yml desde los archivos finales; probar la actualización conservando ajustes y contenido. No sobrescribir activos de versiones anteriores.
