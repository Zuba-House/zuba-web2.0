import { Router } from 'express';
import uploadPdf from '../middlewares/multerPdf.js';
import { submitJobApplication } from '../controllers/jobApplication.controller.js';

const jobApplicationRouter = Router();

// Submit job application (public route, no auth required)
jobApplicationRouter.post('/submit', uploadPdf.single('resume'), submitJobApplication);

export default jobApplicationRouter;

