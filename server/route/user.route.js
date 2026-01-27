import { Router } from 'express'
import {addReview, approveReview, authWithGoogle, changePasswordController, deleteMultiple, deleteUser, forgotPasswordController, getAllReviews, getAllUsers, getProductReviewsAdmin, getReviews, loginUserController, logoutController, logoutAllNonAdminUsers, markReviewAsSpam, refreshToken, registerUserController, rejectReview, removeImageFromCloudinary, resetpassword, resendOTPController, updateUserDetails, userAvatarController, userDetails, verifyEmailController, verifyForgotPasswordOtp} from '../controllers/user.controller.js';
import auth, { optionalAuth } from '../middlewares/auth.js';
import requireAdminEmail from '../middlewares/adminEmailCheck.js';
import upload from '../middlewares/multer.js';

const userRouter = Router()
userRouter.post('/register',registerUserController)
userRouter.post('/verifyEmail',verifyEmailController)
userRouter.post('/resend-otp',resendOTPController)
userRouter.post('/login',loginUserController)
userRouter.post('/authWithGoogle',authWithGoogle)
userRouter.get('/logout',auth,logoutController);
// Admin only: Logout all non-admin users
userRouter.post('/logout-all-non-admin', auth, requireAdminEmail, logoutAllNonAdminUsers);
userRouter.put('/user-avatar',auth,upload.array('avatar'),userAvatarController);
userRouter.delete('/deteleImage',auth,removeImageFromCloudinary);
userRouter.put('/:id',auth,updateUserDetails);
userRouter.post('/forgot-password',forgotPasswordController)
userRouter.post('/verify-forgot-password-otp',verifyForgotPasswordOtp)
userRouter.post('/reset-password',resetpassword)
userRouter.post('/forgot-password/change-password',changePasswordController)
userRouter.post('/refresh-token',refreshToken)
userRouter.get('/user-details',auth,userDetails);
// Allow both guests and logged-in users to add reviews
userRouter.post('/addReview', optionalAuth, addReview);
userRouter.get('/getReviews',getReviews);
userRouter.get('/getAllReviews',auth, requireAdminEmail, getAllReviews); // Admin only
userRouter.get('/getProductReviewsAdmin/:productId', auth, requireAdminEmail, getProductReviewsAdmin); // Admin only - get reviews for specific product
userRouter.get('/getAllUsers',auth, requireAdminEmail, getAllUsers);
userRouter.delete('/deleteMultiple',auth, requireAdminEmail, deleteMultiple);
userRouter.delete('/deleteUser/:id',auth, requireAdminEmail, deleteUser);
// Admin review management routes
userRouter.post('/reviews/:reviewId/approve', auth, requireAdminEmail, approveReview);
userRouter.post('/reviews/:reviewId/reject', auth, requireAdminEmail, rejectReview);
userRouter.post('/reviews/:reviewId/spam', auth, requireAdminEmail, markReviewAsSpam);


export default userRouter