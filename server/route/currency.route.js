import { Router } from 'express';
import {
  detectCurrencyController,
  getCurrencyRatesController,
} from '../controllers/currency.controller.js';

const currencyRouter = Router();

currencyRouter.get('/rates', getCurrencyRatesController);
currencyRouter.get('/detect', detectCurrencyController);

export default currencyRouter;
