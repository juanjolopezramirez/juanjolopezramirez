# The Alef Code · el portal (antes «Álef»)

Guía para ti, Juanjo. Sin tecnicismos. Si algo no se entiende, el error es de la guía, no tuyo.

---

## 0. Lo que te falta hacer, en orden, y DÓNDE se hace cada cosa

Todo se hace en el **navegador** (Chrome, Edge…) salvo los pasos marcados con 📱, que son en tu **celular**. Ninguno pide pegarme nada en el chat.

| # | Dónde (aplicación o página) | Qué haces | Cómo sabes que quedó bien |
|---|---|---|---|
| 1 | **Supabase** — supabase.com → proyecto **alef-code** → menú izquierdo **Authentication** → **URL Configuration** | En **Site URL** pones `https://juanjolopezramirez.com`. En **Redirect URLs** añades, una por una: `https://juanjolopezramirez.com/es/portal/`, `/en/portal/`, `/pt/portal/`, `/fr/portal/` y `/it/portal/` (cada una con el `https://juanjolopezramirez.com` delante). **Save**. | En tu web, «Continuar con Google» te devuelve al portal y no a `localhost:3000`. |
| 2 | **Supabase** — mismo proyecto → **Authentication** → **Sign In / Providers** (o **Settings**, según la versión) | Encendido: **Confirm email**, **Secure email change** y **Secure password change**. Apagado: **Allow anonymous sign-ins**. | Los interruptores quedan como dice aquí. |
| 3 | **Tu cuenta de Google** — myaccount.google.com → **Seguridad** | Activa la **Verificación en 2 pasos** y, si te lo ofrece, una **llave de acceso** (passkey). Guarda los códigos de respaldo en papel. | Google te pide el segundo paso al entrar en otro equipo. |
| 4 | **Supabase** — tu foto (arriba a la derecha) → **Account preferences** → **Security** / **Multi-factor authentication** | Activa la verificación en 2 pasos de **tu cuenta de Supabase** (es la llave maestra de todo). | Supabase te pide un código al entrar. |
| 5 | **GitHub** — github.com → tu foto → **Settings** → **Password and authentication** | Activa **Two-factor authentication**. | GitHub te pide un código al entrar. |
| 6 | **GitHub** — **Settings** → **Emails** | Marca **Keep my email addresses private** y **Block command line pushes that expose my email**. | En tus próximos cambios ya no sale tu Gmail. |
| 7 | **Tu web** — juanjolopezramirez.com/es/portal/ | Entra con Google. Te lleva al panel. Abre **Seguridad** → **Añadir un dispositivo**. | Ves un código QR y una clave. |
| 8 | 📱 **Google Authenticator** (o Authy) en tu celular | Botón **+** → **Escanear un código QR** → apunta al QR de la pantalla. Aparece «The Alef Code» con 6 números. | La app muestra los 6 números, que cambian cada 30 segundos. |
| 9 | **Tu web** — la misma pantalla del paso 7 | Escribe esos 6 números y pulsa **Confirmar**. | «Listo. Este dispositivo ya sirve para entrar.» |
| 10 | **Tu web** + 📱 un **segundo** dispositivo (otra app, otro teléfono o tu gestor de contraseñas: 1Password, Bitwarden…) | Repite 7 → 9 con ese respaldo. **Desde la misma conexión a internet** de principio a fin. | En «Dispositivos» salen **dos**. |
| 11 | **Tu web** | Pulsa **Salir** y vuelve a entrar con Google. | El panel te pide **«Escribe tu código»** antes de abrirse. |
| 12 | **Supabase** — **SQL Editor** (menú izquierdo) → **New query** | En tu computador abre el archivo `juanjo-web/supabase/006_admin_aal2.sql` (con el Bloc de notas o VS Code), copia **todo**, pégalo en el editor y pulsa **Run**. | Dice «Success». Si dice «Primero añade tu celular…», te faltó el paso 9: no cambió nada. |
| 13 | **Supabase** — **SQL Editor** → **New query** | Abre `juanjo-web/supabase/990_comprobar_rls.sql`, copia todo, pega, y corre las consultas **11, 12 y 13** (selecciona cada una y **Run**). | 11 dice **true**; 12 y 13 salen **vacías**. |

Si un menú de Supabase, Google o GitHub cambió de nombre, busca la palabra en su buscador: lo que importa es lo que hace cada paso. Si te pierdes en alguno, dime el número del paso y lo vemos.

---

## 1. Qué es

**Álef** es la puerta del sitio. «Caminemos» ya no abre una hoja con tres puertas: lleva a `/es/portal/`.

```
Caminemos ──► Álef (portal)
                 ├─ Entrar con Google, o con correo y contraseña
                 ├─ Pedir acceso  → queda «esperando» hasta que tú lo apruebes
                 └─ ¿Prefieres escribirme?  → WhatsApp y correo, siempre visibles
              ya aprobado ──► Panel (/es/portal/panel/)
                 ├─ Inicio: «Dar el primer paso» (el test) y «Cuadremos un rato»
                 ├─ Tú (solo admin): Escribir · Libros · Proyectos · Trabajos · Videos
                 ├─ Quién entra (solo admin): aprobar, rechazar, invitar
                 └─ Solo para mí (solo admin): Diario · Hábitos · Crecimiento
```

- **Solo tú** apruebas. Nadie más puede, ni siquiera con la clave pública del sitio.
- El test (`/contact/`) y «Cuadremos un rato» (`/meet/`) ahora **solo se abren después de entrar y estar aprobado**.
- `/direct/` («Escríbeme directo») ya no es una página: redirige al portal, donde «¿Prefieres escribirme?» hace lo mismo.
- El portal, el panel, el test y «Cuadremos» **no salen en Google** (`noindex`) ni en el mapa del sitio.

## 2. Qué está listo y qué falta

| | Estado |
|---|---|
| Tarjeta de entrada (entrar, pedir acceso, olvidé mi contraseña, contraseña nueva, pendiente, rechazado) | Lista |
| Panel con todas sus secciones | Lista (las secciones existen) |
| «Quién entra»: ver esperando, aprobar, rechazar, quitar acceso, invitar | Lista y probada en demo |
| Escribir blog, Libros, Proyectos, Trabajos, Videos | **Existen y dicen «Pronto»**. Las tablas ya están en la base (`002`). Falta la pantalla de cada una cuando me expliques la estructura |
| Diario, Hábitos, Crecimiento (privados) | **Existen y dicen «Pronto»**. Tablas ya creadas (`003`) |
| Textos | Solo en español. En los otros cuatro idiomas sale el español hasta que los apruebes |
| Supabase y Google | **Faltan. Son tuyos** (sección 4) |

## 3. Probarlo ya, sin Supabase

```bash
npm run dev
```

Y abres, en el navegador (con `?demo=` no se toca ninguna base; **nada se guarda**):

| Para ver… | Dirección |
|---|---|
| La tarjeta de entrada | `http://localhost:4321/es/portal/?demo=entrar` |
| Ya pediste acceso (esperando) | `http://localhost:4321/es/portal/?demo=pendiente` |
| Te dije que no | `http://localhost:4321/es/portal/?demo=rechazado` |
| Eres miembro aprobado | `http://localhost:4321/es/portal/panel/?demo=miembro` |
| Eres tú, el admin | `http://localhost:4321/es/portal/panel/?demo=admin#accesos` |
| El test, ya aprobado | `http://localhost:4321/es/contact/?demo=miembro` |

En el formulario de entrar, el correo decide quién eres: `admin@…` entra como admin, `miembro@…` como miembro, `rechazado@…` como rechazado, `error@…` falla, `lento@…` tarda 3 segundos. «Continuar con Google» entra como pendiente.

En la publicación de verdad **no existe la demo**: sin Supabase conectado, el portal dice «Pronto» y el test sigue abierto (para no encerrarlo detrás de una puerta que nadie puede abrir todavía).

## 4. Ponerlo a funcionar de verdad (lo haces tú)

Orden exacto. Si el panel de Supabase o de Google cambió un nombre, busca la palabra en su buscador: lo que importa es lo que hace cada paso.

> ### Regla de oro
> **Nunca pegues una clave, una contraseña ni un código en el chat conmigo.** Ni aquí, ni en un correo, ni en un issue. Yo no las necesito: tú las pones en un archivo en tu computador y en la web de GitHub. Si alguna vez una se escapa, ve a la sección 7.

### A. Crear el proyecto en Supabase
1. Entra a supabase.com con tu cuenta y crea un proyecto nuevo. Guarda la contraseña de la base donde guardas las demás.
2. Cuando esté listo, abre **Project Settings → API**. Ahí hay dos cosas que vas a necesitar:
   - la **URL del proyecto** (`https://algo.supabase.co`)
   - la **clave pública** (se llama *anon* o *publishable*)
   - ⚠️ Esa página también muestra una clave **secreta** (*service_role* o *secret*). **Esa no se usa para nada en este sitio. No la copies a ningún lado.** El portal la detecta y la rechaza si la pones por error.

### B. Pegar el SQL (las reglas de la base)
En Supabase → **SQL Editor**, abre cada archivo de la carpeta `supabase/`, copia **todo** su contenido, pégalo y pulsa **Run**. **En este orden**:

1. `001_perfiles_y_acceso.sql`
2. `002_contenido.sql`
3. `003_privado.sql`
4. `004_almacen.sql`
5. `005_indice_registros.sql`
6. `006_admin_aal2.sql` — **todavía no**: va después de poner el código de tu celular (paso F2).

**Ya hecho el 2026-10-26:** el proyecto se creó y estos cinco ya están aplicados y revisados. Solo hace falta repetirlo si algún día creas otro proyecto.

Cada uno se puede volver a pegar sin romper nada. Si alguno da error, **no sigas**: cópiame el texto del error (no tiene claves) y lo arreglo.

### C. Ajustes de entrada (Authentication)
En el panel de Supabase, sección **Authentication**:

- **Providers → Email → «Confirm email»: ENCENDIDO.** Es lo que impide que alguien se registre con un correo ajeno.
- **«Allow anonymous sign-ins»: APAGADO.**
- **URL Configuration:**
  - **Site URL:** `https://juanjolopezramirez.com`
  - **Redirect URLs** (la lista de direcciones permitidas), **las cinco exactas, una por línea** (Supabase recomienda dirección exacta en producción, no comodines: con `**` un sitio clonado podría recibir el código de entrada):
    - `https://juanjolopezramirez.com/es/portal/`
    - `https://juanjolopezramirez.com/en/portal/`
    - `https://juanjolopezramirez.com/pt/portal/`
    - `https://juanjolopezramirez.com/fr/portal/`
    - `https://juanjolopezramirez.com/it/portal/`
  - **Solo mientras pruebas en tu computador**, añade también `http://localhost:4321/**`, y **bórrala al terminar**. Lo mismo con `http://localhost:4321` en los orígenes de Google (paso D).

### D. Entrar con Google
**En Google Cloud** (console.cloud.google.com):
1. Crea un proyecto (o usa uno).
2. En **Google Auth Platform**: configura **Audience** (quién puede entrar) y **Branding** (nombre y logo que verá la gente en la pantalla de Google).
3. En **Clients** → crea un cliente de tipo **Web application**:
   - **Authorized JavaScript origins:** `https://juanjolopezramirez.com` y, para probar en tu computador, `http://localhost:4321`.
   - **Authorized redirect URIs:** la dirección que te muestra Supabase en **Authentication → Providers → Google** (se llama *Callback URL*; la copias de ahí).
4. Guarda el **Client ID** y el **Client secret** que te da Google.

**En Supabase:** **Authentication → Providers → Google** → pega el Client ID y el Client secret → enciende el proveedor. (Estos dos van **solo ahí**, nunca en el sitio ni en el chat.)

Con los datos básicos (correo y perfil) Google **no pide verificación**. Mientras pruebas solo tú, puede quedarse en «Testing» (en ese estado Google solo deja entrar a los correos que añadas como *usuarios de prueba*: añade el tuyo); para que entre más gente, pásala a **«In production»** en **Audience**.

### E. Poner las dos variables en tu computador
1. En la carpeta `juanjo-web` copia `.env.example` y llámalo **`.env`**.
2. Rellena **solo** estas dos líneas (sin comillas, sin espacios):
   ```
   PUBLIC_SUPABASE_URL=la URL del paso A
   PUBLIC_SUPABASE_ANON_KEY=la clave pública del paso A
   ```
3. `.env` no se sube a GitHub nunca (está en `.gitignore`).
4. Reinicia `npm run dev`. Sin `?demo=`, ahora habla con Supabase de verdad.
5. **La compilación se para sola** si pones algo mal en estas dos variables (la clave secreta por error, una URL con otra forma, o solo una de las dos). Te dice qué pasa en una frase, sin repetir la clave. Es a propósito: todo lo que empieza por `PUBLIC_` viaja dentro del archivo publicado, y una clave secreta ahí se podría leer aunque el portal la ignore. Si te pasa con la secreta: genera una nueva en Supabase y borra la vieja.

### F. Hacerte admin (la única forma que existe)
1. Abre `http://localhost:4321/es/portal/` y pulsa **Continuar con Google** con la cuenta de Google que va a ser la de admin. Vas a ver «Tu solicitud llegó»: **es lo esperado**.
2. En `supabase/` copia `900_semilla_admin.ejemplo.sql` a `900_semilla_admin.sql` (esa copia queda fuera de GitHub), cambia `TU_CORREO_AQUI` por tu correo, pégala en el SQL Editor y pulsa **Run**. Al final debe decir **admins = 1**.
3. Recarga el portal: ya entras al panel y ves «Quién entra».
4. Pega `990_comprobar_rls.sql` en el SQL Editor y córrelo consulta por consulta (selecciona una y Run). Los resultados dicen cómo leerlos (arriba del archivo). Si algo sale distinto a lo que dice, me lo cuentas.

### F2. El código de tu celular (solo para tu cuenta de admin)
Así, aunque alguien entrara con tu Google, no abriría nada de admin sin los 6 números de tu app.
1. En el panel → **Seguridad** → **Añadir un dispositivo**. Escanea el QR con tu app (Google Authenticator, Authy o tu gestor de contraseñas) y escribe el primer código. Hazlo desde la misma conexión de principio a fin.
2. Repite con un **segundo dispositivo de respaldo** (otra app, otro teléfono o tu gestor de contraseñas). Supabase no da códigos de recuperación: el respaldo es eso.
3. Sal y vuelve a entrar: el panel te pide el código. Bien.
4. Pega `006_admin_aal2.sql` **entero** en el SQL Editor → **Run**. Desde ahora la BASE exige el código (si algún admin aún no tiene dispositivo, el archivo se niega y no cambia nada).
5. Corre `990_comprobar_rls.sql`: las consultas 11, 12 y 13 dicen si quedó bien.
(Paso a paso y con el nombre de cada aplicación: la tabla de la sección 0, pasos 7 a 13.)
- **Si pierdes todos tus dispositivos:** abre `910_deshacer_006.sql`, cambia `'NO'` por `'SI'` (viene apagado a propósito), pégalo en el SQL Editor (tu cuenta de Supabase, con su propia verificación), sal, entra, añade un dispositivo nuevo enseguida y vuelve a pegar el 006.
- **No quites dispositivos desde dos pestañas a la vez**: el panel nunca deja quitar el último, pero dos pestañas abiertas podrían quitar uno cada una.
- En Supabase → Authentication → Settings, deja encendidos **Secure password change** y **Secure email change**: así una sesión robada sin código tampoco cambia tu contraseña ni tu correo.
- **«Cerrar mis otras sesiones»** (en Seguridad) saca a cualquier otro navegador donde haya quedado abierta tu cuenta.
- Activa también la verificación en 2 pasos de tu **cuenta de Supabase**: es la llave maestra de todo esto.

### G. Publicar
1. En GitHub → el repositorio → **Settings → Secrets and variables → Actions → pestaña Secrets** → `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY` con los mismos dos valores. Son públicos (viajan dentro de la web), pero como *Secrets* no salen escritos en los registros públicos de cada publicación. Desde este computador se cargan sin copiarlos a mano con `gh secret set -f .env -R juanjolopezramirez/juanjolopezramirez` (lee tu `.env`, que debe tener SOLO esas dos líneas).
2. El archivo de publicación (`.github/workflows/astro.yml`) ya los usa (`secrets.PUBLIC_SUPABASE_*`) y corre `node tools/test-portal.mjs` antes de compilar. **No publico nada sin tu «sí, súbelo».**

## 5. Entrar con correo y contraseña

Funciona, pero el correo de confirmación necesita **SMTP propio**: el que trae Supabase de fábrica manda **2 correos por hora** y no sirve para producción. Hasta que tengas uno (el de tu dominio, o un servicio de envío), lo honesto es dejar **Google como entrada principal**. La opción de correo seguirá en la tarjeta; si el correo no llega, la persona puede escribirte desde «¿Prefieres escribirme?».

Cómo se configura: Supabase → **Authentication** → SMTP (guía oficial: supabase.com/docs/guides/auth/auth-smtp).

## 6. Cómo se da el acceso

- **Alguien pide acceso** (Google o correo) → queda **esperando** → lo ves en *Quién entra* con su nombre, correo y motivo → **Aprobar** o **Rechazar**.
- **Tú invitas** (*Quién entra → Invitar*): escribes su correo. Cuando esa persona entre **con Google con ese mismo correo**, queda aprobada sola. (Con correo y contraseña **no** se aprueba sola, aunque esté invitada: la apruebas tú. Es a propósito: es la única forma de que nadie robe una invitación.)
- Solo existe **un** admin y se crea **solo por SQL** (paso F). Desde la web nadie puede hacerse admin ni cambiar su propio estado.
- Si rechazas a alguien, ve «Por ahora no puedo abrirte» y tu contacto.

## 7. Seguridad, en lenguaje simple

- El repositorio es **público**. Por eso en él no hay ninguna clave real. La clave pública que va en el sitio **no abre nada por sí sola**: lo que protege los datos son las reglas del SQL (RLS), que se comprueban en el servidor de Supabase.
- **Una página oculta no es una página protegida.** `/contact/` y `/meet/` están escondidas para quien no entró, pero su texto está en el sitio. Lo realmente privado (diario, hábitos, crecimiento, lista de personas) **vive solo en la base** y nadie lo lee sin sesión y sin permiso.
- Tu **diario, hábitos y crecimiento** los ve **solo tu cuenta**. Ni siquiera otro admin los vería (no hay regla que lo permita).
- La sesión queda guardada en el navegador de quien entra. Por eso el portal no usa scripts de terceros ni `innerHTML`.
- **Cola de solicitudes**: el perfil nace al registrarse (aunque no confirme el correo) y no hay captcha. Si alguien llena «Esperando» de basura, el panel ya no pierde a los demás (muestra los 100 más recientes de cada grupo y dice «Hay más»); si crece, se activa el captcha de Supabase o se pide el correo confirmado antes de crear el perfil.
- **Clickjacking**: el panel no se abre dentro de una página ajena (marco). GitHub Pages no deja poner cabeceras de seguridad propias; lo que sí se puede es una política de contenido (CSP) y autoalojar las fuentes: queda como mejora futura.
- **Si se escapa una clave** (la secreta o la del Client secret de Google): en Supabase / Google Cloud, **genera una nueva y borra la vieja** (no basta con quitarla del chat o del código), y avísame para revisar el historial. Si fue la pública, rótala igual, pero el riesgo es bajo.
- **Supabase gratis se pausa** si el proyecto pasa unos días sin uso. Si pasa, entra a su panel y pulsa restaurar; el portal mientras tanto dice «No pude conectar».
- Pruebas automáticas: `node tools/test-portal.mjs` (comprueba, entre otras cosas, que no haya claves en el código ni en lo compilado, y la forma del SQL).

## 8. Lo que viene

Cuando me expliques la estructura de cada sección, se construye una a una (Escribir, Libros, Proyectos, Trabajos, Videos, Diario, Hábitos, Crecimiento). Si necesitan campos nuevos, va en un archivo **nuevo** (`007_…sql`): los de ahora no se vuelven a editar.

## 9. Si algo no va

| Pasa esto | Casi seguro es |
|---|---|
| El portal dice «Pronto» | Faltan las dos variables (`.env` en tu computador, *Secrets* en GitHub) |
| Dice «No pude conectar» | La URL está mal escrita, el proyecto está pausado, o no hay internet |
| Google vuelve con un error | Falta la dirección en **Redirect URLs** (C) o el *redirect URI* en Google Cloud (D) |
| Entras con Google y quedas «esperando» siendo tú | Falta el paso F (la semilla) |
| «Quién entra» sale vacío siendo tú admin | Falta el paso F, o entraste con otro correo |
| El correo de confirmación no llega | SMTP de fábrica (sección 5) |
| La API dice *permission denied* en una tabla nueva | A propósito: las tablas nuevas no regalan permisos; falta su `grant` (ver `001`) |

---

*Preparado con el equipo ECC: planificador (plan), database-reviewer y security-reviewer (SQL), code-reviewer, security-reviewer y a11y-architect (código y pantallas).*
