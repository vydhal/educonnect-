
import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '../middleware/errorHandler.js'; // Ensure correct path or remove if not needed for simple upload

const router = Router();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Create unique filename: timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'file-' + uniqueSuffix + ext);
    }
});

// File filter (images only)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(null, false); // Reject file
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

// Upload endpoint
router.post('/', upload.single('file'), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            throw new Error('Please upload a file');
        }

        // Construct public URL
        // Assuming server serves 'public' folder at root or specific path
        // Check server.ts configuration. If served at /uploads, URL is /uploads/filename
        // But usually 'public' is static root. So if file is in public/uploads, url is /uploads/filename

        // Dynamic base URL would be better but let's assume relative path returned to client
        // Client or Server can prepend host. Returning relative path is safer.
        const protocol = req.protocol;
        const host = req.get('host');
        const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

        res.json({
            message: 'File uploaded successfully',
            url: fileUrl
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
