import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Rating from "@mui/material/Rating";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import CircularProgress from '@mui/material/CircularProgress';
import { MyContext } from '../../App';
import { fetchDataFromApi, postData } from '../../utils/api';
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

export const ReviewPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const context = useContext(MyContext);
    
    const [reviewRequest, setReviewRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        rating: 5,
        review: '',
        title: '',
        userName: ''
    });

    useEffect(() => {
        fetchReviewRequest();
    }, [token]);

    const fetchReviewRequest = async () => {
        try {
            setLoading(true);
            const res = await fetchDataFromApi(`/api/review-requests/${token}`);
            
            if (res?.error === false && res?.data) {
                setReviewRequest(res.data);
                setFormData(prev => ({
                    ...prev,
                    userName: res.data.customerName || ''
                }));
            } else {
                setError(res?.message || 'Review request not found or invalid');
            }
        } catch (err) {
            console.error('Error fetching review request:', err);
            setError('Failed to load review request');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.review || formData.review.trim() === '') {
            context.alertBox('error', 'Please write a review');
            return;
        }

        if (!formData.userName || formData.userName.trim() === '') {
            context.alertBox('error', 'Please enter your name');
            return;
        }

        try {
            setSubmitting(true);
            const res = await postData(`/api/review-requests/${token}/submit`, {
                rating: formData.rating,
                review: formData.review,
                title: formData.title || formData.review.substring(0, 100),
                userName: formData.userName
            });

            if (res?.error === false) {
                context.alertBox('success', res?.message || 'Review submitted successfully!');
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            } else {
                context.alertBox('error', res?.message || 'Failed to submit review');
            }
        } catch (err) {
            console.error('Error submitting review:', err);
            context.alertBox('error', 'Failed to submit review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <CircularProgress />
                    <p className="mt-4 text-gray-600">Loading review request...</p>
                </div>
            </div>
        );
    }

    if (error || !reviewRequest) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Review Request Not Found</h2>
                    <p className="text-gray-600 mb-6">{error || 'This review request link is invalid or has expired.'}</p>
                    <Button 
                        variant="contained" 
                        color="primary"
                        onClick={() => navigate('/')}
                    >
                        Go to Home
                    </Button>
                </div>
            </div>
        );
    }

    const productImage = reviewRequest.productImage || 
                        reviewRequest.productId?.images?.[0]?.url || 
                        reviewRequest.productId?.featuredImage || 
                        '/placeholder.png';

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">
                            Share Your Experience
                        </h1>
                        <p className="text-gray-600">
                            We'd love to hear your feedback about your recent purchase
                        </p>
                    </div>

                    {/* Product Info */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-8">
                        <div className="flex items-center gap-6">
                            <LazyLoadImage
                                src={productImage}
                                alt={reviewRequest.productName}
                                effect="blur"
                                className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                            />
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-1">
                                    {reviewRequest.productName}
                                </h3>
                                {reviewRequest.orderNumber && (
                                    <p className="text-sm text-gray-500">
                                        Order #{reviewRequest.orderNumber}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Review Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Your Rating *
                            </label>
                            <Rating
                                name="rating"
                                value={formData.rating}
                                onChange={(event, newValue) => {
                                    setFormData(prev => ({ ...prev, rating: newValue || 5 }));
                                }}
                                size="large"
                            />
                        </div>

                        <div>
                            <TextField
                                label="Your Name *"
                                fullWidth
                                required
                                value={formData.userName}
                                onChange={(e) => setFormData(prev => ({ ...prev, userName: e.target.value }))}
                                variant="outlined"
                            />
                        </div>

                        <div>
                            <TextField
                                label="Review Title (Optional)"
                                fullWidth
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                variant="outlined"
                                placeholder="Give your review a title"
                            />
                        </div>

                        <div>
                            <TextField
                                label="Your Review *"
                                fullWidth
                                required
                                multiline
                                rows={6}
                                value={formData.review}
                                onChange={(e) => setFormData(prev => ({ ...prev, review: e.target.value }))}
                                variant="outlined"
                                placeholder="Tell us about your experience with this product..."
                                helperText={`${formData.review.length}/2000 characters`}
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                size="large"
                                disabled={submitting || !formData.review.trim() || !formData.userName.trim()}
                                className="flex-1"
                            >
                                {submitting ? (
                                    <>
                                        <CircularProgress size={20} className="mr-2" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Review'
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outlined"
                                onClick={() => navigate('/')}
                                size="large"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        <p>Your review will be reviewed by our team before being published.</p>
                        <p className="mt-1">Thank you for taking the time to share your feedback!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewPage;

