require('dotenv').config(); // Carga las variables de entorno desde un archivo .env
const express = require('express');
const multer = require('multer'); // Middleware para manejar la subida de archivos
const fs = require('fs'); // Módulo de Node.js para manipulación de archivos
const path = require('path'); // Módulo para manejar rutas de archivos
const { PDFDocument } = require('pdf-lib'); // Librería para manipular archivos PDF
const sharp = require('sharp'); // Librería para procesar imágenes
const pdfPoppler = require('pdf-poppler'); // Librería para convertir PDF a imágenes
const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const serviceAccount = require(process.env.FIREBASE_JSON); // Ruta al archivo de la clave de servicio de Firebase

// Inicializa Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_BUCKET // Asegúrate de que en tu .env FIREBASE_BUCKET tenga el nombre real de tu bucket
});

const bucket = getStorage().bucket(); // Obtiene el bucket de almacenamiento

// Objeto para almacenar la fecha de expiración de cada archivo
const urlExpirations = {};

// Token de autenticación definido en variables de entorno
const AUTH_TOKEN = process.env.PDFAUTH_TOKEN;
if (!AUTH_TOKEN) {
    console.error("Error: AUTH_TOKEN no está definido en las variables de entorno.");
    process.exit(1);
}

// Middleware para verificar el token en cada solicitud
const authenticateToken = (req, res) => {
    const token = req.headers['authorization']; // Obtiene el token del encabezado de la solicitud
    if (!token || token.replace('Bearer ', '') !== AUTH_TOKEN) {
        return res.status(403).json({ error: 'Forbidden: Token inválido o ausente' });
    }
};

// Configurar multer para manejar la subida de archivos en la carpeta 'uploads'
const upload = multer({ dest: '/tmp/uploads/' });

// Función para subir archivos al bucket de Firebase Storage
async function uploadToFirestore(filePath, destination) {
    await bucket.upload(filePath, {
        destination: destination, // Ruta donde guardar el archivo en el bucket
        metadata: { contentType: 'application/pdf' },
    });
    console.log(`Archivo subido a ${destination}`);
}

// Crear servidor Express
const app = express();
app.use(express.json());  // Middleware para parsear JSON en el cuerpo de las solicitudes

// Ruta para convertir el PDF
app.post('/convert-pdf', (req, res) => {
    if (req.method === 'POST') {
        try {
            authenticateToken(req, res);

            // Usar multer para manejar el archivo PDF subido
            const uploadHandler = upload.single('pdf');
            uploadHandler(req, res, async (err) => {
                if (err) {
                    console.error('Error de Multer:', err);
                    return res.status(500).send('Error al procesar el archivo.');
                }

                const pdfPath = req.file.path; // Ruta del archivo PDF subido
                const outputFolder = '/tmp/images'; // Carpeta donde se guardarán las imágenes extraídas del PDF
                const outputPdfFolder = '/tmp/output'; // Carpeta donde se guardará el nuevo PDF convertido
                fs.mkdirSync(outputFolder, { recursive: true });
                fs.mkdirSync(outputPdfFolder, { recursive: true });

                // Convertir PDF a imágenes con alta resolución usando pdf-poppler
                const options = {
                    format: 'png',
                    out_dir: outputFolder,
                    out_prefix: 'page',
                    scale: 2000
                };
                await pdfPoppler.convert(pdfPath, options);
                fs.unlinkSync(pdfPath); // Eliminar el PDF original

                // Obtener la lista de imágenes generadas
                const imageFiles = fs.readdirSync(outputFolder)
                    .filter(file => file.endsWith('.png'))
                    .map(file => path.join(outputFolder, file));

                // Crear un nuevo PDF con las imágenes procesadas
                const newPdf = await PDFDocument.create();
                for (let imagePath of imageFiles) {
                    const imageBuffer = await sharp(imagePath)
                        .resize({ width: 2480, height: 3508, fit: 'inside' })
                        .toBuffer();
                    const image = await newPdf.embedPng(imageBuffer);
                    const page = newPdf.addPage([612, 792]);
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

                // Subir el nuevo PDF al bucket de Firebase Storage
                await uploadToFirestore(outputPdfPath, `output_pdfs/${outputPdfFilename}`);

                // Establecer el tiempo de expiración a 5 minutos
                const expirationTimestamp = Date.now() + 5 * 60 * 1000;
                urlExpirations[outputPdfFilename] = expirationTimestamp;

                // Generar un signed URL para el archivo subido (válido hasta el timestamp definido)
                const file = bucket.file(`output_pdfs/${outputPdfFilename}`);
                const [signedUrl] = await file.getSignedUrl({
                    action: 'read',
                    expires: expirationTimestamp,
                });
                console.log("Signed download URL:", signedUrl);

                // Responder con el enlace de descarga y el endpoint para consultar el tiempo restante
                res.json({
                    downloadUrl: signedUrl,
                    timeRemainingUrl: `https://${req.headers.host}/time-remaining/${outputPdfFilename}`
                });

                // Programar eliminación del archivo del bucket, de las imágenes locales y de la expiración en memoria después de 5 minutos
                setTimeout(async () => {
                    try {
                        await bucket.file(`output_pdfs/${outputPdfFilename}`).delete();
                        for (let imagePath of imageFiles) {
                            await fs.promises.unlink(imagePath);
                        }
                        delete urlExpirations[outputPdfFilename];
                        console.log(`Archivos y datos de ${outputPdfFilename} eliminados.`);
                    } catch (err) {
                        console.error('Error eliminando archivos:', err);
                    }
                }, 5 * 60 * 1000);
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error procesando el archivo.');
        }
    } else {
        res.status(405).send('Método no permitido.');
    }
});

// Ruta para consultar el tiempo restante de validez del enlace
app.get('/time-remaining/:filename', (req, res) => {
    const { filename } = req.params;
    const expirationTimestamp = urlExpirations[filename];
    if (!expirationTimestamp) {
        return res.status(404).json({ error: 'No se encontró la información para este archivo.' });
    }
    const timeRemainingMs = expirationTimestamp - Date.now();
    const timeRemainingSeconds = Math.max(0, Math.floor(timeRemainingMs / 1000));
    res.json({ filename, timeRemainingSeconds });
});

// Arrancar el servidor Express
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor Express escuchando en el puerto ${port}`);
});
