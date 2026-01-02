# ZX AI OS — Android wrapper (TWA) skeleton

Este directorio contiene instrucciones y ejemplos mínimos para empaquetar la SPA como un APK usando Trusted Web Activity (TWA) o un WebView nativo que puede ser seleccionado como *Launcher* (HOME) en Android.

Resumen rápido
- Recomendado: usar TWA (Bubblewrap) para empaquetar la web app sin reescribir la UI.
- Alternativa: crear un proyecto Android nativo (Kotlin) con `WebView` y declarar la `Activity` que responda al intent `HOME`.

Pasos básicos (TWA vía Bubblewrap)

1. Construye los assets web:

```bash
npm install
npm run build
```

2. Sube `dist/` a un host accesible por URL (necesario para TWA) o usa un servidor local público como `localtunnel`/`ngrok` en desarrollo.

3. Instala Bubblewrap y crea el wrapper:

```bash
npx @bubblewrap/cli init --manifest=https://your-deployed-site/manifest.json
# Sigue los prompts: package id (ej. com.yourcompany.zxaios), certificado de firma, nombre, iconos, start-url, etc.
npx @bubblewrap/cli build
```

4. Resultado: `./output` contendrá el APK instalable.

Declarar como Launcher
- En el `AndroidManifest.xml` generado por Bubblewrap (o en el proyecto nativo), añade el intent filter en la `Activity` principal:

```xml
<intent-filter>
  <action android:name="android.intent.action.MAIN" />
  <category android:name="android.intent.category.HOME" />
  <category android:name="android.intent.category.DEFAULT" />
</intent-filter>
```

Integración con Termux (opcional)
- Para ejecutar comandos Linux desde la app, usar un módulo nativo que llame a Termux via Intents o `PackageManager`.
- Documentación: `../docs/TERMUX_INTEGRATION.md`.

Notas de seguridad
- No incluyas claves en el APK. Sigue usando `process.env`/`VITE_*` y configura claves en CI o en tiempo de build.
- Verifica las reglas de Firebase si usas servicios remotos.

Ejemplo: proyecto nativo mínimo
- `MainActivity.kt` (ejemplo) y `AndroidManifest.xml` de ejemplo incluidos en este directorio.
