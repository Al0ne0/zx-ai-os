# ZX AI OS — Flutter wrapper (scaffold)

Este directorio contiene plantillas y código fuente para empaquetar la SPA como APK usando Flutter en CI.

Flujo en CI (ya configurado en `.github/workflows/build-apk.yml`):
1. Se ejecuta `npm ci && npm run build` en la raíz para generar `dist/` de la SPA.
2. El workflow inicializa un proyecto Flutter (si no existe) con `flutter create .`.
3. Copia los assets web construidos a `android-wrapper/flutter/assets/www/`.
4. Sobrescribe `lib/main.dart` y archivos Android de plantilla con los que están en este directorio.
5. Ejecuta `flutter build apk --release` y sube el APK como artifact.

Notas de edición local
- Puedes editar `lib/main.dart` aquí. Durante el CI el archivo será usado para compilar.
- Para compilar localmente sin Android SDK, usa la opción de CI (descargar artifact desde GitHub Actions) o instala SDK/JDK localmente.
