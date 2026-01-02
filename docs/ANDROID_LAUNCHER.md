# Opciones para convertir la SPA en un Launcher Android (guía técnica)

Resumen rápido
- La app actual es una SPA en React/Vite. Para que sea el Launcher (HOME) y pueda integrarse con Termux sin root, se necesita un contenedor nativo (APK) que sirva la SPA y exponga un bridge nativo.

Opciones viables (ordenadas por recomendación)

1) Trusted Web Activity (TWA) + APK wrapper (recomendado inicialmente)
   - Usar Bubblewrap o una plantilla Android para empaquetar la web app como APK.
   - Crear un módulo nativo mínimo que:
     - Declare el intent filter para HOME/LAUNCHER (para poder ser seleccionado como launcher).
     - Expose un bridge para detectar/llamar a Termux mediante Intents (comunicación segura).
   - Ventajas: no requiere reescribir la UI, mantiene la SPA intacta.
   - Limitaciones: para ejecutar comandos Linux se necesita que el usuario tenga Termux instalado o que el APK incluya un runtime nativo (más complejo).

2) Android WebView native wrapper (app nativa mínima)
   - Crear un proyecto Android (Kotlin) que carga la SPA desde assets en un WebView.
   - Implementar `addJavascriptInterface` para exponer funciones como `execCommand`.
   - Marcar el Manifest para recibir `HOME` intent.
   - Puede integrarse con Termux vía Intents (recommended) o empaquetar un runtime nativo.

3) Flutter wrapper (posible, más trabajo)
   - Crear un proyecto Flutter que use `webview_flutter` y empaquete los assets web.
   - Implementar un `MethodChannel` para bridge nativo (execCommand, startDesktopSession).
   - Declarar el intent HOME en `AndroidManifest.xml` dentro del proyecto Flutter.
   - Comentario: Esto requiere crear un proyecto Flutter separado y mantener sincronización de assets. Tiene sentido si planeas utilizar Flutter para otras partes nativas.

Notas sobre Termux / Linux user-space
- Recomendado: no intentar empacar un Linux completo dentro del APK. En su lugar:
  - Detectar Termux (via Intent/URI scheme) y, si está presente, solicitar permiso al usuario para abrir una sesión o ejecutar comandos.
  - Documentar claramente al usuario que instalar Termux es necesario para funcionalidad avanzada (apt/pip/node).
- Alternativa avanzada: incluir PRoot/proot y binarios nativos dentro del APK (gran complejidad, mantenimiento y peso). No recomendado inicialmente.

Seguridad y permisos
- Evitar permisos peligrosos. Para launcher sólo son necesarios permisos normales (INTERNET, etc.).
- Para integrar Termux via Intent, no se requieren permisos especiales.

Próximos pasos sugeridos
1. Implementar el bridge web (`services/linuxBridge.ts`) y componentes UI de terminal (esto ya está preparado en el repo).
2. Elegir packaging: TWA (rápido) o Flutter wrapper (si necesitas Flutter). Yo recomiendo TWA para empezar.
3. Probar implementación nativa mínima: crear un Activity que maneje `ACTION_MAIN` + `CATEGORY_HOME` y cargue la SPA.
