# Integración con Termux (guía práctica)

Objetivo
- Permitir que el launcher (APK) se comunique con Termux para ejecutar comandos, instalar paquetes y arrancar entornos proot sin requerir root.

Estrategia recomendada
1. Detectar Termux desde la app nativa:
   - Intent URI: `com.termux.API` o comprobar si el paquete `com.termux` está instalado.
   - En Android nativo (Kotlin/Java) usar `packageManager.getPackageInfo("com.termux", 0)`.

2. Comunicación: usar Termux:API o Termux:Boot
   - Termux proporciona el paquete `com.termux` y varios intents / servicios que permiten ejecutar comandos remotamente.
   - Alternativa: usar `am start-foreground-service` o `am broadcast` para pasar comandos.

3. Bridge nativo
   - Implementar un módulo nativo que traduzca llamadas JavaScript (`execCommand`) a Intents hacia Termux.
   - Usar `startService` o `startActivity` con extras que Termux entiende.

4. Mostrar salida en la SPA
   - El wrapper nativo debe capturar stdout/stderr y devolverlo por WebView postMessage o por `MethodChannel` en Flutter.

Limitaciones y seguridad
- No todos los dispositivos tienen Termux; la app debe degradar graciosamente a un stub (como el `linuxBridge` web stub).
- Ejecutar comandos implica riesgos. Validar entradas y aplicar sandboxing en el componente nativo cuando sea posible.

Comandos de ejemplo (nativo -> Termux intent)
- Ejecutar un comando simple desde Android:
  ```bash
  am broadcast -a com.termux.RUN_COMMAND --es com.termux.RUN_COMMAND_PATH "/data/data/com.termux/files/usr/bin/bash" --es com.termux.RUN_COMMAND_ARGUMENTS "-lc 'ls -la'" 
  ```

Notas para desarrolladores
- Para debugging rápido en desarrollo, el `linuxBridge` web stub (services/linuxBridge.ts) devuelve salidas simuladas.
- Documentar para usuarios: instruir instalar `Termux` desde F-Droid y habilitar `Termux:API` si se usa.
