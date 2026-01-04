import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Ensure uploads directory exists
const uploadsDir = 'uploads/resumes';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure directory exists
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Sanitize filename
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `resume_${Date.now()}_${sanitized}`);
    },
});

const uploadPdf = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit for resumes
    },
    fileFilter: (req, file, cb) => {
        // Accept PDF files only
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

export default uploadPdf;

