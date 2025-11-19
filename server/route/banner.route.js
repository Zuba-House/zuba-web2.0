import { Router } from 'express';
import auth from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';
import {
    uploadBannerImage,
    updateBannerContent,
    getAllBanners,
    getPublicBanners,
    deleteBanner,
    toggleBannerStatus
} from '../controllers/banner.controller.js';

const bannerRouter = Router();

// Public route - Get active banners
bannerRouter.get('/public', getPublicBanners);

// Admin routes - require authentication
bannerRouter.post('/upload', auth, upload.single('banner'), uploadBannerImage);
bannerRouter.post('/content', auth, updateBannerContent);
bannerRouter.get('/', auth, getAllBanners);
bannerRouter.delete('/:type', auth, deleteBanner);
bannerRouter.put('/:type/toggle', auth, toggleBannerStatus);

export default bannerRouter;

