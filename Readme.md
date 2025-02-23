# 📄 Convertidor de PDF a Imágenes y Reconversión a PDF

## 📌 Descripción
Este sistema es una solución empresarial desarrollada en **Node.js** con **Express**, diseñada para convertir archivos **PDF a imágenes** y luego reconstruirlos en un nuevo **PDF optimizado**. La aplicación cuenta con un mecanismo de seguridad basado en **Bearer Token**, asegurando un acceso controlado y protegido.

Este producto es desarrollado y mantenido por **Andres Azcona**, CTO de **Nordle Technologies**.

## 🚀 Beneficios Clave
- 📂 **Gestión avanzada de archivos PDF**.
- 🎨 **Conversión de alta calidad con optimización de imágenes**.
- 📜 **Generación eficiente de documentos PDF a partir de imágenes**.
- 🔐 **Seguridad y control de acceso con autenticación basada en token**.
- ⏳ **Manejo automático de expiración y eliminación de archivos**.

## 🛠️ Tecnologías Implementadas
- **Node.js**
- **Express.js**
- **Multer** (para la gestión de archivos)
- **pdf-poppler** (para la conversión de PDF a imágenes)
- **pdf-lib** (para la manipulación avanzada de PDFs)
- **sharp** (para la optimización y mejora de calidad de imágenes)

## 📦 Instalación y Configuración
### 1️⃣ Clonar el repositorio
```sh
git clone https://github.com/tu_usuario/tu_repositorio.git
cd tu_repositorio
```

### 2️⃣ Instalación de dependencias
```sh
npm install
```

### 3️⃣ Configuración de variables de entorno
Cree un archivo `.env` en la raíz del proyecto y agregue la siguiente configuración:
```ini
AUTH_TOKEN=clave_de_autenticacion_segura
```

### 4️⃣ Ejecución del servidor
```sh
node index.js
```
El sistema estará disponible en `http://localhost:3000`.

## 📤 Uso de la API
### 1️⃣ Conversión de PDF a imágenes y reconstrucción
**Endpoint:** `POST /convert`

**Requisitos:**
- **Encabezado:**
  ```
  Authorization: Bearer clave_de_autenticacion_segura
  ```
- **Cuerpo de la solicitud:**
  - Form-data con la clave `pdf` y un archivo PDF adjunto.

**Respuesta esperada:**
```json
{
  "downloadUrl": "http://localhost:3000/downloads/converted_123456.pdf",
  "timeRemainingUrl": "http://localhost:3000/time-remaining/converted_123456.pdf"
}
```

### 2️⃣ Consulta del tiempo restante para descarga
**Endpoint:** `GET /time-remaining/:filename`

**Ejemplo:**
```sh
GET http://localhost:3000/time-remaining/converted_123456.pdf
```

**Respuesta esperada:**
```json
{
  "timeRemaining": 238.5  // Tiempo restante en segundos
}
```

## 📜 Licencia y Propiedad Intelectual
Este producto es propiedad de **Nordle Technologies** y está protegido bajo la licencia **MIT**.

### 📌 Contacto
📧 **Correo:** contacto@nordletech.com  
🌐 **Sitio Web:** [www.nordletech.com](https://www.nordletech.com)  
© 2025 **Nordle Technologies**. Todos los derechos reservados.
# 📄 Convertidor de PDF a Imágenes y Reconversión a PDF

## 📌 Descripción
Este sistema es una solución empresarial desarrollada en **Node.js** con **Express**, diseñada para convertir archivos **PDF a imágenes** y luego reconstruirlos en un nuevo **PDF optimizado**. La aplicación cuenta con un mecanismo de seguridad basado en **Bearer Token**, asegurando un acceso controlado y protegido.

Este producto es desarrollado y mantenido por **Andres Azcona**, CTO de **Nordle Technologies**.

## 🚀 Beneficios Clave
- 📂 **Gestión avanzada de archivos PDF**.
- 🎨 **Conversión de alta calidad con optimización de imágenes**.
- 📜 **Generación eficiente de documentos PDF a partir de imágenes**.
- 🔐 **Seguridad y control de acceso con autenticación basada en token**.
- ⏳ **Manejo automático de expiración y eliminación de archivos**.

## 🛠️ Tecnologías Implementadas
- **Node.js**
- **Express.js**
- **Multer** (para la gestión de archivos)
- **pdf-poppler** (para la conversión de PDF a imágenes)
- **pdf-lib** (para la manipulación avanzada de PDFs)
- **sharp** (para la optimización y mejora de calidad de imágenes)

## 📦 Instalación y Configuración
### 1️⃣ Clonar el repositorio
```sh
git clone https://github.com/tu_usuario/tu_repositorio.git
cd tu_repositorio
```

### 2️⃣ Instalación de dependencias
```sh
npm install
```

### 3️⃣ Configuración de variables de entorno
Cree un archivo `.env` en la raíz del proyecto y agregue la siguiente configuración:
```ini
AUTH_TOKEN=clave_de_autenticacion_segura
```

### 4️⃣ Ejecución del servidor
```sh
node index.js
```
El sistema estará disponible en `http://localhost:3000`.

## 📤 Uso de la API
### 1️⃣ Conversión de PDF a imágenes y reconstrucción
**Endpoint:** `POST /convert`

**Requisitos:**
- **Encabezado:**
  ```
  Authorization: Bearer clave_de_autenticacion_segura
  ```
- **Cuerpo de la solicitud:**
  - Form-data con la clave `pdf` y un archivo PDF adjunto.

**Respuesta esperada:**
```json
{
  "downloadUrl": "http://localhost:3000/downloads/converted_123456.pdf",
  "timeRemainingUrl": "http://localhost:3000/time-remaining/converted_123456.pdf"
}
```

### 2️⃣ Consulta del tiempo restante para descarga
**Endpoint:** `GET /time-remaining/:filename`

**Ejemplo:**
```sh
GET http://localhost:3000/time-remaining/converted_123456.pdf
```

**Respuesta esperada:**
```json
{
  "timeRemaining": 238.5  // Tiempo restante en segundos
}
```

## 📜 Licencia y Propiedad Intelectual
Este producto es propiedad de **Nordle Technologies** y está protegido bajo la licencia **MIT**.

### 📌 Contacto
📧 **Correo:** andres@nordletech.com  
🌐 **Sitio Web:** [www.nordletech.com](https://www.nordle.tech)  
© 2025 **Nordle Technologies**. Todos los derechos reservados.
