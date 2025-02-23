// NORDLE PDF SERVER API
// @autor: Andres Azcona
// @date: 2025-02-22
// @description: API para convertir PDF a imágenes y generar un nuevo PDF con alta resolución para evitar copias no autorizadas.
// @version: 1.0
// Status: LIVE

require('dotenv').config(); // Carga las variables de entorno desde un archivo .env
const express = require('express'); // Importa Express para manejar el servidor web
const multer = require('multer'); // Middleware para manejar la subida de archivos
const fs = require('fs'); // Módulo de Node.js para manipulación de archivos
const path = require('path'); // Módulo para manejar rutas de archivos
const { PDFDocument } = require('pdf-lib'); // Librería para manipular archivos PDF
const sharp = require('sharp'); // Librería para procesar imágenes
const pdfPoppler = require('pdf-poppler'); // Librería para convertir PDF a imágenes

const app = express(); // Crea una instancia de Express
const port = 3000; // Puerto en el que correrá el servidor

// Token de autenticación definido en variables de entorno
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
    console.error("Error: AUTH_TOKEN no está definido en las variables de entorno.");
    process.exit(1); // Detiene la ejecución si no hay un token definido
}

// Middleware para verificar el token en cada solicitud
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization'); // Obtiene el token del encabezado de la solicitud
    if (!token || token.replace('Bearer ', '') !== AUTH_TOKEN) { // Verifica que el token sea válido
        return res.status(403).json({ error: 'Forbidden: Token inválido o ausente' }); // Retorna error 403 si no es válido
    }
    next(); // Continúa con la ejecución si el token es correcto
};

// Configurar multer para manejar la subida de archivos en la carpeta 'uploads'
const upload = multer({ dest: 'uploads/' });

// Servir archivos estáticos desde la carpeta 'output', solo si el usuario está autenticado
app.use('/downloads', authenticateToken, express.static(path.join(__dirname, 'output')));

// Objeto para almacenar los tiempos de expiración de los archivos generados
const fileExpirations = {};

// Endpoint para procesar el PDF subido por el usuario
app.post('/convert', authenticateToken, upload.single('pdf'), async (req, res) => {
    try {
        const pdfPath = req.file.path; // Ruta del archivo PDF subido
        const outputFolder = 'images'; // Carpeta donde se guardarán las imágenes extraídas del PDF
        const outputPdfFolder = 'output'; // Carpeta donde se guardará el nuevo PDF convertido
        fs.mkdirSync(outputFolder, { recursive: true }); // Crea la carpeta si no existe
        fs.mkdirSync(outputPdfFolder, { recursive: true });

        // Configuración para convertir PDF a imágenes con alta resolución usando pdf-poppler
        const options = {
            format: 'png', // Formato de salida
            out_dir: outputFolder, // Directorio donde se guardarán las imágenes
            out_prefix: 'page', // Prefijo del nombre de los archivos de salida
            scale: 2000 // Aumenta la escala para mayor resolución
        };
        await pdfPoppler.convert(pdfPath, options); // Convierte el PDF a imágenes PNG

        // Eliminar el archivo PDF original después de la conversión
        fs.unlinkSync(pdfPath);

        // Obtener la lista de imágenes generadas
        const imageFiles = fs.readdirSync(outputFolder)
            .filter(file => file.endsWith('.png')) // Filtrar solo archivos PNG
            .map(file => path.join(outputFolder, file)); // Obtener las rutas completas de los archivos

        // Crear un nuevo PDF con las imágenes procesadas
        const newPdf = await PDFDocument.create();
        for (let imagePath of imageFiles) {
            const imageBuffer = await sharp(imagePath)
                .resize({ width: 2480, height: 3508, fit: 'inside' }) // Ajustar al tamaño A4
                .toBuffer();
            const image = await newPdf.embedPng(imageBuffer); // Incrustar la imagen en el PDF
            const page = newPdf.addPage([612, 792]); // Tamaño carta
            page.drawImage(image, {
                x: 0,
                y: 0,
                width: 612,
                height: 792,
            });
        }

        // Guardar el nuevo PDF en la carpeta 'output'
        const outputPdfFilename = `converted_${Date.now()}.pdf`;
        const outputPdfPath = path.join(outputPdfFolder, outputPdfFilename);
        const pdfBytes = await newPdf.save();
        await fs.promises.writeFile(outputPdfPath, pdfBytes);

        // Verificar que el archivo PDF generado exista
        if (!fs.existsSync(outputPdfPath)) {
            return res.status(500).send('Error: El archivo no fue generado correctamente.');
        }

        // Calcular el tiempo de expiración del archivo (5 minutos)
        const expirationTime = Date.now() + 5 * 60 * 1000;
        fileExpirations[outputPdfFilename] = expirationTime;

        // Enlaces para descargar el archivo y consultar el tiempo restante
        const downloadLink = `${req.protocol}://${req.get('host')}/downloads/${outputPdfFilename}`;
        const timeRemainingLink = `${req.protocol}://${req.get('host')}/time-remaining/${outputPdfFilename}`;
        res.json({ downloadUrl: downloadLink, timeRemainingUrl: timeRemainingLink });

        // Programar eliminación del archivo PDF y sus imágenes después de 5 minutos
        setTimeout(async () => {
            try {
                await fs.promises.unlink(outputPdfPath); // Elimina el PDF convertido
                delete fileExpirations[outputPdfFilename]; // Elimina su referencia en el objeto de expiraciones
                for (let imagePath of imageFiles) {
                    await fs.promises.unlink(imagePath); // Elimina cada imagen generada
                }
            } catch (err) {
                console.error('Error eliminando archivos:', err);
            }
        }, 5 * 60 * 1000);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error procesando el archivo.'); // Retorna error en caso de fallo
    }
});

// Endpoint para consultar el tiempo restante de descarga
app.get('/time-remaining/:filename', authenticateToken, (req, res) => {
    const filename = req.params.filename; // Nombre del archivo consultado
    const expirationTime = fileExpirations[filename]; // Tiempo de expiración del archivo
    if (!expirationTime) {
        return res.status(404).json({ error: 'El archivo ya no está disponible.' }); // Si ya expiró, retorna error
    }
    const timeRemaining = Math.max(0, expirationTime - Date.now()); // Calcula el tiempo restante en milisegundos
    res.json({ timeRemaining: timeRemaining / 1000 }); // Retorna el tiempo restante en segundos
});

// Iniciar el servidor en el puerto definido
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
