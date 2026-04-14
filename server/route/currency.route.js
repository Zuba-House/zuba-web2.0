import { Router } from 'express';
import { getRates, detectDisplayCurrency } from '../controllers/currency.controller.js';

const router = Router();

router.get('/rates', getRates);
router.get('/detect', detectDisplayCurrency);

export default router;
