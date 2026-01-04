import { Router } from 'express';
import uploadPdf from '../middlewares/multerPdf.js';
import { submitJobApplication } from '../controllers/jobApplication.controller.js';

const jobApplicationRouter = Router();

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File size too large. Maximum size is 5MB.'
            });
        }
        if (err.message === 'Only PDF files are allowed') {
            return res.status(400).json({
                success: false,
                error: 'Only PDF files are allowed. Please upload a PDF file.'
            });
        }
        return res.status(400).json({
            success: false,
            error: err.message || 'File upload error'
        });
    }
    next();
};

// Submit job application (public route, no auth required)
jobApplicationRouter.post('/submit', 
    uploadPdf.single('resume'),
    handleMulterError,
    submitJobApplication
);

export default jobApplicationRouter;

