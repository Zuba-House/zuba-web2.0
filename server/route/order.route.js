import { Router } from "express";
import auth, { optionalAuth } from "../middlewares/auth.js";
import { 
    confirmOrderPaymentController,
    createOrderController, 
    deleteOrder, 
    getOrderByIdController,
    getOrderDetailsController, 
    getTotalOrdersCountController, 
    getUserOrderDetailsController, 
    totalSalesController, 
    totalUsersController, 
    updateOrderStatusController 
} from "../controllers/order.controller.js";

const orderRouter = Router();

// Order creation requires authentication
orderRouter.post('/create', auth, createOrderController)
orderRouter.post('/confirm-payment/:orderId', optionalAuth, confirmOrderPaymentController)
orderRouter.get("/order-list", auth, getOrderDetailsController)
orderRouter.put('/order-status/:id', auth, updateOrderStatusController)
orderRouter.get('/count', auth, getTotalOrdersCountController)
orderRouter.get('/sales', auth, totalSalesController)
orderRouter.get('/users', auth, totalUsersController)
orderRouter.get('/order-list/orders', auth, getUserOrderDetailsController)
orderRouter.delete('/deleteOrder/:id', auth, deleteOrder)
// Must be last — catches MongoDB order ids only
orderRouter.get('/:orderId', optionalAuth, getOrderByIdController)

export default orderRouter;