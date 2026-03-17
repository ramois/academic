# Despliegue en AWS (EC2)

Guía paso a paso para registrar una cuenta en AWS, preparar el entorno y desplegar este proyecto (monorepo frontend + backend) en producción usando **GitHub Actions** para tests y despliegue automático.

---

## 1. Registro en AWS

1. Entra en [aws.amazon.com](https://aws.amazon.com) y pulsa **Crear una cuenta de AWS**.
2. Completa el formulario (email, contraseña, nombre de cuenta).
3. Elige **Tipo de cuenta**: Personal.
4. Introduce datos de facturación (tarjeta). No se te cobrará nada si te mantienes dentro del **Free Tier**.
5. Verifica identidad por teléfono.
6. Elige plan **Soporte básico (gratuito)**.
7. Confirma el email y accede a la consola: [console.aws.amazon.com](https://console.aws.amazon.com).

### Uso gratuito (Free Tier)

- **EC2**: 750 h/mes de instancia **t2.micro** (1 vCPU, 1 GB RAM) durante 12 meses.
- **RDS** (opcional): 750 h/mes de instancia **db.t2.micro** (MySQL/PostgreSQL) 12 meses.
- Puedes usar una **sola** t2.micro para la app y, si quieres ahorrar, instalar PostgreSQL en la misma máquina (sin RDS) para no consumir otro recurso del free tier.

---

## 2. Crear una instancia EC2

1. En la consola AWS, busca **EC2** y entra en **Instancias**.
2. **Lanzar instancia**:
   - **Nombre**: `academic-ddd` (o el que prefieras).
   - **AMI**: Amazon Linux 2023 o **Ubuntu 22.04 LTS** (recomendado para Node.js).
   - **Tipo**: **t2.micro** (elegible para free tier).
   - **Par de claves**: Crear nuevo → nombre `academic-key` → **Descargar** el `.pem` y guárdalo en un lugar seguro (lo usarás en GitHub Secrets).
   - **Configuración de red**: Crear grupo de seguridad:
     - SSH (22) desde **Mi IP** (o 0.0.0.0/0 solo para pruebas).
     - HTTP (80) desde 0.0.0.0/0.
     - HTTPS (443) desde 0.0.0.0/0.
     - Puerto **3000** (API) desde 0.0.0.0/0.
     - Puerto **5173** o **80** (frontend) según cómo sirvas el front (ver más abajo).
3. **Almacenamiento**: 8 GB (incluido en free tier).
4. Lanzar instancia y esperar a que el estado sea **En ejecución**. Anota la **IP pública**.

---

## 3. Conectar por SSH y preparar el servidor

Desde tu máquina (reemplaza `TU_IP` y `tu-key.pem`):

```bash
chmod 400 tu-key.pem
ssh -i tu-key.pem ubuntu@TU_IP
```

### Instalar Node.js (LTS), Git, Nginx y PostgreSQL (Ubuntu)

```bash
# Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Nginx (para servir frontend y/o proxy a la API)
sudo apt install -y nginx
```

### Configurar PostgreSQL

```bash
sudo -u postgres psql -c "CREATE USER academic WITH PASSWORD 'PON_AQUI_UN_PASSWORD_SEGURO';"
sudo -u postgres psql -c "CREATE DATABASE academic OWNER academic;"
```

Crea un usuario de sistema para la app (opcional pero recomendado):

```bash
sudo useradd -m -s /bin/bash app
sudo su - app
```

### Clonar el repo y configurar la app (manual primera vez)

En la instancia (como `ubuntu` o como `app`):

```bash
git clone https://github.com/TU_USUARIO/academic-ddd.git
cd academic-ddd
```

Crear `.env` para el backend en `packages/backend/.env`:

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=genera_un_secreto_largo_y_aleatorio
TYPEORM_HOST=localhost
TYPEORM_PORT=5432
TYPEORM_USERNAME=academic
TYPEORM_PASSWORD=PON_AQUI_UN_PASSWORD_SEGURO
TYPEORM_DATABASE=academic
STUDENT_DEFAULT_PASSWORD=TempStudent1!
```

Instalar dependencias y construir:

```bash
npm ci
npm run build
```

### PM2 para backend y servir frontend

```bash
sudo npm install -g pm2
# Backend
cd packages/backend && pm2 start dist/main.js --name api
# Frontend (estático): build ya hecho en raíz; servir con nginx (recomendado) o con 'npx serve'
cd ../..
```

### Nginx como proxy y estáticos

Crear `/etc/nginx/sites-available/academic`:

```nginx
server {
    listen 80;
    server_name TU_IP_O_DOMINIO;

    root /home/ubuntu/academic-ddd/packages/frontend/dist;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Si prefieres que la API esté en `/` y el front en otro path, ajusta `location`. Luego:

```bash
sudo ln -s /etc/nginx/sites-available/academic /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Configurar PM2 para que arranque al reiniciar:

```bash
pm2 startup
pm2 save
```

---

## 4. GitHub Actions: tests y despliegue a EC2

El flujo debe: **(1)** ejecutar tests unitarios, **(2)** ejecutar tests e2e y **(3)** desplegar en EC2 solo si todo pasa.

En el repositorio, crea el workflow que se indica en [GitHub Actions (común)](#github-actions-común) más abajo. Luego añade un **job de despliegue a AWS** que se ejecute tras los tests (por ejemplo, solo en `main`).

### Secrets en GitHub

En el repo: **Settings → Secrets and variables → Actions** y crea:

| Secret            | Descripción                          |
|-------------------|--------------------------------------|
| `AWS_EC2_HOST`    | IP pública o DNS de tu instancia EC2 |
| `AWS_EC2_USER`    | `ubuntu` (o el usuario que uses)     |
| `SSH_PRIVATE_KEY` | Contenido completo del archivo `.pem`|

(Opcional) Si usas variables de entorno en el servidor vía script: `BACKEND_ENV` con el contenido de `.env` del backend (no recomendado si incluye secretos; mejor inyectar solo en el servidor).

### Ejemplo de job de deploy a EC2 (añadir al workflow)

```yaml
  deploy-aws:
    needs: [test-unit, test-e2e]
    if: github.ref == 'refs/heads/main' && github.repository == 'TU_USUARIO/academic-ddd'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.AWS_EC2_HOST }}
          username: ${{ secrets.AWS_EC2_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd academic-ddd
            git pull origin main
            npm ci
            npm run build
            cd packages/backend && pm2 restart api
            cd ../frontend && pm2 restart frontend || true
```

Ajusta rutas y nombres de procesos PM2 según tu estructura (por ejemplo, si sirves el front con Nginx, no hace falta `pm2 restart frontend`).

---

## 5. Despliegue con Docker en EC2 (paso a paso)

Construye las imágenes en GitHub Actions (tras CI) y despliega en EC2 con Docker. Archivos: [packages/backend/Dockerfile](../../packages/backend/Dockerfile), [packages/frontend/Dockerfile](../../packages/frontend/Dockerfile), [docker-compose.yml](../../docker-compose.yml). Workflow [.github/workflows/docker-build.yml](../../.github/workflows/docker-build.yml) hace build y push a **ghcr.io** cuando CI pasa.

**Requisitos:** Cuenta AWS, instancia EC2 creada (sección 2). En esta guía se usa solo Docker en EC2 (no hace falta instalar Node ni PM2 en el host).

---

### 5.1. Instalar Docker en la instancia EC2

Conéctate por SSH (reemplaza `TU_IP` y `tu-key.pem`):

```bash
chmod 400 tu-key.pem
ssh -i tu-key.pem ubuntu@TU_IP
```

En la instancia, instala Docker y Docker Compose (plugin):

```bash
sudo apt update && sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu
```

Cierra sesión y vuelve a entrar para que el grupo `docker` aplique (o ejecuta `newgrp docker`).

---

### 5.2. Permisos del workflow para GHCR

En el repositorio: **Settings → Actions → General → Workflow permissions** → elige **Read and write permissions** para que el workflow pueda hacer push de imágenes a GitHub Container Registry.

---

### 5.3. Directorio de la app y compose de producción en EC2

En EC2:

```bash
mkdir -p ~/academic-ddd && cd ~/academic-ddd
```

Crea un archivo `docker-compose.prod.yml` (solo en el servidor; no lo subas al repo si contiene referencias a secretos). Reemplaza `TU_OWNER` por el owner del repo (ej. tu usuario de GitHub):

```yaml
# ~/academic-ddd/docker-compose.prod.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${TYPEORM_PASSWORD}
      POSTGRES_DB: academic
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  backend:
    image: ghcr.io/TU_OWNER/academic-ddd-backend:latest
    env_file: .env.production
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    image: ghcr.io/TU_OWNER/academic-ddd-frontend:latest
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

---

### 5.4. Variables de entorno en el servidor (`.env.production`)

En EC2, dentro de `~/academic-ddd/`:

```bash
vi .env.production
```

Contenido (usa valores reales de producción; **no** subas este archivo al repo):

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=genera_un_secreto_largo_y_aleatorio_aqui
TYPEORM_HOST=postgres
TYPEORM_PORT=5432
TYPEORM_USERNAME=postgres
TYPEORM_PASSWORD=tu_password_postgres_seguro
TYPEORM_DATABASE=academic
STUDENT_DEFAULT_PASSWORD=TempStudent1!
```

Guarda y restringe permisos: `chmod 600 .env.production`.

---

### 5.5. Secrets y variables en GitHub

En el repo: **Settings → Secrets and variables → Actions**.

**Secrets (obligatorios para el deploy por SSH):**

| Secret             | Descripción |
|--------------------|-------------|
| `AWS_EC2_HOST`     | IP pública o DNS de la instancia EC2 |
| `AWS_EC2_USER`     | Usuario SSH (ej. `ubuntu`) |
| `SSH_PRIVATE_KEY`  | Contenido completo del archivo `.pem` |
| `GHCR_PAT`         | Personal Access Token de GitHub con scope `read:packages` (para `docker login` en el job de deploy) |

**Variable (opcional, para el build del frontend):**

| Variable        | Ejemplo                         | Uso |
|-----------------|----------------------------------|-----|
| `VITE_API_BASE` | `https://tu-dominio.com/api` o `http://TU_IP/api` | URL pública de la API; se usa en el build del frontend en el workflow. Si no la defines, la imagen usará la por defecto. |

---

### 5.6. Job de deploy en el workflow de Docker

Añade un job de deploy en [.github/workflows/docker-build.yml](../../.github/workflows/docker-build.yml) que se ejecute tras `build-and-push`, solo en `main`. El job debe conectarse por SSH a EC2, hacer login en GHCR, pull de las imágenes y levantar los contenedores con el archivo de env.

Ejemplo (ajusta el nombre del compose si usas otro):

```yaml
  deploy-ec2:
    needs: [build-and-push]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.AWS_EC2_HOST }}
          username: ${{ secrets.AWS_EC2_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ~/academic-ddd
            echo "${{ secrets.GHCR_PAT }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
            docker compose -f docker-compose.prod.yml pull
            docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

Si las migraciones se ejecutan aparte (por ejemplo con un comando en el backend), añade en el script algo como:

```bash
docker compose -f docker-compose.prod.yml run --rm backend npm run migrations:run
```

(ajusta el comando según tu proyecto).

---

### 5.7. Primera puesta en marcha (manual en EC2)

Antes del primer deploy automático, en EC2 debes tener ya el `docker-compose.prod.yml` y el `.env.production` (pasos 5.3 y 5.4). Luego haz login en GHCR (una vez; puedes usar el mismo token que guardaste en `GHCR_PAT`):

```bash
cd ~/academic-ddd
echo "TU_GITHUB_PAT" | docker login ghcr.io -u TU_USUARIO_GITHUB --password-stdin
docker compose -f docker-compose.prod.yml --env-file .env.production pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

Si tienes migraciones, ejecútalas (por ejemplo `docker compose -f docker-compose.prod.yml run --rm backend npm run migrations:run`).

---

### 5.8. Comprobar que todo funciona

- En el navegador: `http://TU_IP_EC2` (frontend) y `http://TU_IP_EC2/api/health` (o la ruta de health de tu backend).
- En EC2: `docker compose -f docker-compose.prod.yml ps` y `docker compose -f docker-compose.prod.yml logs -f` para ver contenedores y logs.

---

### Cuándo configurar las variables de entorno

- **Al construir la imagen (GitHub Actions):** No hace falta configurar `JWT_SECRET`, `TYPEORM_*`, etc. en el workflow. La imagen del backend no lleva secretos; los lee en tiempo de ejecución. Opcionalmente usa la variable de repositorio `VITE_API_BASE` como build-arg del frontend para la URL pública de la API.

- **En EC2 (runtime):** Las variables se configuran en el archivo `.env.production` del servidor (paso 5.4) y se pasan con `--env-file .env.production` al levantar los contenedores. No pongas valores de producción en el `docker-compose.yml` del repo.

---

## 6. Resumen de pasos para “subir a producción”

**Opción A – Node/PM2 (secciones 3 y 4):**

1. **AWS**: Cuenta creada, EC2 t2.micro lanzada, seguridad (22, 80, 443, 3000).
2. **Servidor**: Node.js, Git, PostgreSQL, Nginx (y PM2).
3. **App**: Clonar repo, `packages/backend/.env`, `npm ci && npm run build`, PM2 para API, Nginx para frontend.
4. **GitHub**: Secrets `AWS_EC2_HOST`, `AWS_EC2_USER`, `SSH_PRIVATE_KEY`.
5. **Pipeline**: Workflow con tests unitarios → tests e2e → deploy a EC2 en `main`.

**Opción B – Docker (sección 5):**

1. **AWS**: Cuenta creada, EC2 t2.micro lanzada, seguridad (22, 80, 443).
2. **EC2**: Instalar Docker y Docker Compose (5.1), crear `~/academic-ddd`, `docker-compose.prod.yml` (5.3) y `.env.production` (5.4).
3. **GitHub**: Workflow permissions Read and write (5.2). Secrets: `AWS_EC2_HOST`, `AWS_EC2_USER`, `SSH_PRIVATE_KEY`, `GHCR_PAT`. Opcional: variable `VITE_API_BASE` (5.5).
4. **Pipeline**: CI → Docker Build and Push a GHCR → job `deploy-ec2` (SSH, login GHCR, pull, `docker compose up -d`) (5.6).
5. **Primera vez**: En EC2, login en GHCR y `docker compose up -d` manual (5.7).

---

## Tips para usar AWS de forma gratuita

- Usa **solo una instancia t2.micro** y, si es posible, PostgreSQL en la misma máquina para no activar RDS.
- **Parar** la instancia cuando no la uses (desde la consola EC2) para no consumir las 750 h en pocas semanas.
- No uses instancias distintas a t2.micro (o las equivalentes en free tier) si quieres mantener coste 0.
- Activa **alertas de facturación** en **Billing → Budgets** para avisos si superas umbrales.
- Considera **CloudWatch** solo para métricas básicas (incluidas en free tier) y evita logs o retención larga si no es necesario.

---

## Mejores prácticas

- **Seguridad**: No abras SSH (22) a 0.0.0.0/0 en producción; restringe a **Mi IP** o a la IP de tu pipeline.
- **HTTPS**: Cuando tengas dominio, usa **Certificate Manager** y un balanceador o Nginx con Let’s Encrypt.
- **Secrets**: No subas `.pem` ni `.env` al repo; solo en GitHub Secrets o en el servidor con permisos restringidos.
- **Variables**: Mantén `NODE_ENV=production` y `JWT_SECRET` fuerte en producción.
- **Backups**: Si usas RDS o Postgres en EC2, configura copias de seguridad periódicas (scripts o snapshots).

---

## GitHub Actions (común)

El workflow base con **tests unitarios** y **tests e2e** está en [.github/workflows/ci.yml](../../.github/workflows/ci.yml):

- **test-unit**: tests de `packages/backend` y `packages/frontend`.
- **test-e2e**: PostgreSQL en service container, build backend + frontend, migraciones, arranque de API (3000) y front (5173), Playwright con Chromium.

Puedes añadir el job `deploy-aws` en ese mismo archivo (con `needs: [test-unit, test-e2e]`) o en un workflow separado que se dispare tras el CI.
