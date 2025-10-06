# Cómo Publicar tu Aplicación en Vercel desde GitHub

¡Excelente! Publicar tu aplicación en Vercel es un proceso bastante directo. Aquí tienes el paso a paso detallado para asegurarte de que todo funcione correctamente, incluyendo la configuración de tu PIN de acceso.

## Paso 1: Sube tus Cambios a GitHub

Primero, asegúrate de que todo el código esté guardado y subido a tu repositorio de GitHub. Si has estado usando la interfaz de GitHub, es probable que ya esté actualizado. Si no, sigue estos pasos desde una terminal:

1.  **Abre una terminal** en la carpeta de tu proyecto.
2.  **Agrega todos los archivos y cambios**:
    ```bash
    git add .
    ```
3.  **Crea un "commit"** con un mensaje descriptivo:
    ```bash
    git commit -m "Prepara la aplicación para el despliegue final en Vercel"
    ```
4.  **Sube los cambios a tu repositorio** en GitHub:
    ```bash
    git push origin main
    ```
    *(Si tu rama principal se llama `master`, usa `git push origin master`)*.

---

## Paso 2: Configura tu Proyecto en Vercel

Ahora, conectarás tu repositorio de GitHub a Vercel.

1.  **Inicia sesión en Vercel**: Ve a [vercel.com](https://vercel.com/) y accede con tu cuenta (puedes usar tu cuenta de GitHub para que sea más fácil).
2.  **Crea un Nuevo Proyecto**:
    *   En tu panel de control (Dashboard), haz clic en **"Add New..."** y selecciona **"Project"**.
    *   Vercel te mostrará una lista de tus repositorios de GitHub. Haz clic en el botón **"Import"** junto al repositorio de esta aplicación.
3.  **Configuración del Proyecto**: Vercel detectará automáticamente que es un proyecto de Next.js. No necesitas cambiar ninguna configuración de build o instalación. ¡Puedes dejarlo como está!

---

## Paso 3: Agrega la Variable de Entorno (¡Paso Crucial!)

Para que la pantalla de bloqueo con el PIN funcione en la versión pública, debes configurarla en Vercel.

1.  En la página de configuración del proyecto de Vercel (justo después de importar), busca la sección **"Environment Variables"** (Variables de Entorno).
2.  **Agrega una nueva variable**:
    *   **Name**: `NEXT_PUBLIC_PIN_CODE`
    *   **Value**: `1902`
3.  Asegúrate de hacer clic en el botón **"Add"** para guardarla.

![Vercel Environment Variable](https://vercel.com/docs/storage/vercel-storage-add-new-env-var-input.png)

---

## Paso 4: Despliega la Aplicación

1.  Una vez configurada la variable de entorno, haz clic en el botón azul **"Deploy"**.
2.  Vercel comenzará el proceso de compilación y despliegue. Esto puede tardar un par de minutos. Verás un registro de la construcción y, si todo va bien, terminará con un mensaje de éxito.
3.  ¡Listo! Cuando termine, Vercel te dará la URL pública de tu aplicación desplegada (por ejemplo, `tunombre-de-proyecto.vercel.app`).

## Futuros Cambios

A partir de ahora, cada vez que hagas `git push` a tu rama principal en GitHub, Vercel **automáticamente** tomará los cambios y desplegará una nueva versión de tu aplicación. ¡No tendrás que repetir estos pasos nunca más!
