# Cómo Publicar tu Aplicación en Vercel desde GitHub

¡Excelente! Publicar tu aplicación en Vercel es un proceso bastante directo. Aquí tienes el paso a paso detallado para asegurarte de que todo funcione correctamente, incluyendo la configuración de tu PIN de acceso.

## Paso 1: Sube tus Cambios a GitHub

Primero, asegúrate de que todo el código que hemos generado esté guardado y subido a tu repositorio de GitHub.

1.  **Abre una terminal o tu editor de código** en la carpeta del proyecto.
2.  **Agrega todos los archivos nuevos y modificados**:
    ```bash
    git add .
    ```
3.  **Crea un "commit" con un mensaje descriptivo**:
    ```bash
    git commit -m "Prepara la aplicación para el despliegue en Vercel"
    ```
4.  **Sube los cambios a tu repositorio en GitHub**:
    ```bash
    git push origin main
    ```
    *(Reemplaza `main` si usas otra rama principal, como `master`)*.

---

## Paso 2: Configura tu Proyecto en Vercel

Ahora, conectarás tu repositorio de GitHub a Vercel.

1.  **Inicia sesión en Vercel**: Ve a [vercel.com](https://vercel.com/) y accede a tu cuenta.
2.  **Crea un Nuevo Proyecto**:
    *   En tu panel de control, haz clic en **"Add New..."** y selecciona **"Project"**.
    *   Vercel mostrará tus repositorios de GitHub. Haz clic en **"Import"** en el repositorio de tu aplicación de finanzas.
3.  **Configura el Proyecto**: Vercel es muy inteligente y detectará automáticamente que es un proyecto de Next.js, por lo que normalmente no necesitas cambiar ninguna configuración de build.

---

## Paso 3: Agrega la Variable de Entorno (¡Paso Crucial!)

Para que el PIN de acceso funcione, debes configurarlo en Vercel.

1.  En la página de configuración del proyecto, busca la sección **"Environment Variables"** (Variables de Entorno).
2.  **Agrega una nueva variable**:
    *   **Name**: `NEXT_PUBLIC_PIN_CODE`
    *   **Value**: `1902` (o el PIN que desees usar)
3.  Asegúrate de hacer clic en **"Add"** para guardarla.

![Vercel Environment Variable](https://vercel.com/docs/storage/vercel-storage-add-new-env-var-input.png)

---

## Paso 4: Despliega la Aplicación

1.  Una vez configurada la variable de entorno, haz clic en el botón **"Deploy"**.
2.  Vercel comenzará el proceso de compilación y despliegue. Tomará un par de minutos.
3.  ¡Listo! Cuando termine, Vercel te dará la URL pública de tu aplicación desplegada.

## Despliegues Futuros

A partir de ahora, cada vez que hagas `git push` a tu rama principal en GitHub, Vercel automáticamente desplegará los nuevos cambios. ¡No tendrás que repetir estos pasos!
