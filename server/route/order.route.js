import { Router } from "express";
import auth, { optionalAuth } from "../middlewares/auth.js";
import requireAdminEmail from "../middlewares/adminEmailCheck.js";
import { 
    createOrderController, 
    deleteOrder, 
    getOrderDetailsController, 
    getTotalOrdersCountController, 
    getUserOrderDetailsController, 
    totalSalesController, 
    totalUsersController, 
    updateOrderStatusController 
} from "../controllers/order.controller.js";
import { toggleReviewRequest } from "../controllers/reviewRequest.controller.js";

const orderRouter = Router();

// Guest checkout - use optionalAuth (allows both guests and logged-in users)
orderRouter.post('/create', optionalAuth, createOrderController)

// Customer routes - require authentication but not admin
orderRouter.get('/order-list/orders', auth, getUserOrderDetailsController) // Customer's own orders

// Admin-only routes - require full admin access
orderRouter.get("/order-list", auth, requireAdminEmail, getOrderDetailsController)
orderRouter.put('/order-status/:id', auth, requireAdminEmail, updateOrderStatusController)
orderRouter.get('/count', auth, requireAdminEmail, getTotalOrdersCountController)
orderRouter.get('/sales', auth, requireAdminEmail, totalSalesController)
orderRouter.get('/users', auth, requireAdminEmail, totalUsersController)
orderRouter.delete('/deleteOrder/:id', auth, requireAdminEmail, deleteOrder)
orderRouter.put('/:id/review-request-toggle', auth, requireAdminEmail, toggleReviewRequest)

export default orderRouter;