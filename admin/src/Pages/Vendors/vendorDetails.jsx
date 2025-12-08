import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, Typography, Divider, Chip, Grid, Box } from "@mui/material";
import { AiOutlineArrowLeft } from "react-icons/ai";
import { MyContext } from '../../App';
import { fetchDataFromApi, postData } from '../../utils/api';
import CircularProgress from '@mui/material/CircularProgress';
import { formatCurrency } from '../../utils/currency';
import { GoCheck, GoX } from "react-icons/go";

export const VendorDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const context = useContext(MyContext);
    const [vendor, setVendor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getVendorDetails();
    }, [id]);

    const getVendorDetails = async () => {
        setIsLoading(true);
        try {
            const res = await fetchDataFromApi(`/api/vendors/admin/all`);
            if (res?.success && res?.vendors) {
                const foundVendor = res.vendors.find(v => v._id === id);
                if (foundVendor) {
                    setVendor(foundVendor);
                } else {
                    context?.alertBox("error", "Vendor not found");
                    navigate('/vendors');
                }
            }
        } catch (error) {
            console.error('Error fetching vendor:', error);
            context?.alertBox("error", "Failed to load vendor details");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!window.confirm('Are you sure you want to approve this vendor?')) {
            return;
        }

        try {
            const res = await postData(`/api/vendors/admin/${id}/approve`, {});
            if (res?.success) {
                context?.alertBox("success", "Vendor approved successfully");
                getVendorDetails();
            } else {
                context?.alertBox("error", res?.error || "Failed to approve vendor");
            }
        } catch (error) {
            console.error('Error approving vendor:', error);
            context?.alertBox("error", "Failed to approve vendor");
        }
    };

    const handleReject = async () => {
        const reason = window.prompt('Please provide a reason for rejection:');
        if (!reason) {
            return;
        }

        try {
            const res = await postData(`/api/vendors/admin/${id}/reject`, { reason });
            if (res?.success) {
                context?.alertBox("success", "Vendor rejected successfully");
                getVendorDetails();
            } else {
                context?.alertBox("error", res?.error || "Failed to reject vendor");
            }
        } catch (error) {
            console.error('Error rejecting vendor:', error);
            context?.alertBox("error", "Failed to reject vendor");
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <CircularProgress />
            </div>
        );
    }

    if (!vendor) {
        return null;
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'success';
            case 'pending': return 'warning';
            case 'rejected': return 'error';
            case 'suspended': return 'error';
            default: return 'default';
        }
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                    <Button
                        startIcon={<AiOutlineArrowLeft />}
                        onClick={() => navigate('/vendors')}
                    >
                        Back
                    </Button>
                    <h1 className="text-[26px] font-bold">Vendor Details</h1>
                </div>
                {vendor.status === 'pending' && (
                    <div className="flex gap-2">
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<GoCheck />}
                            onClick={handleApprove}
                        >
                            Approve
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<GoX />}
                            onClick={handleReject}
                        >
                            Reject
                        </Button>
                    </div>
                )}
            </div>

            <Grid container spacing={3}>
                {/* Shop Information */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Shop Information</Typography>
                            <Divider className="my-3" />
                            
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 mb-4">
                                    {vendor.shopLogo && (
                                        <img
                                            src={vendor.shopLogo}
                                            alt={vendor.shopName}
                                            className="w-20 h-20 rounded-full object-cover"
                                        />
                                    )}
                                    <div>
                                        <Typography variant="h5">{vendor.shopName}</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            /vendor/{vendor.shopSlug}
                                        </Typography>
                                        <Chip
                                            label={vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                                            color={getStatusColor(vendor.status)}
                                            size="small"
                                            className="mt-2"
                                        />
                                        {vendor.isVerified && (
                                            <Chip
                                                label="Verified"
                                                color="success"
                                                size="small"
                                                className="mt-2 ml-2"
                                            />
                                        )}
                                    </div>
                                </div>

                                {vendor.shopDescription && (
                                    <div>
                                        <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                                        <Typography variant="body2">{vendor.shopDescription}</Typography>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Typography variant="subtitle2" color="textSecondary">Business Name</Typography>
                                        <Typography variant="body1">{vendor.businessName}</Typography>
                                    </div>
                                    <div>
                                        <Typography variant="subtitle2" color="textSecondary">Business Type</Typography>
                                        <Typography variant="body1" className="capitalize">{vendor.businessType}</Typography>
                                    </div>
                                    {vendor.taxId && (
                                        <div>
                                            <Typography variant="subtitle2" color="textSecondary">Tax ID</Typography>
                                            <Typography variant="body1">{vendor.taxId}</Typography>
                                        </div>
                                    )}
                                    {vendor.registrationNumber && (
                                        <div>
                                            <Typography variant="subtitle2" color="textSecondary">Registration Number</Typography>
                                            <Typography variant="body1">{vendor.registrationNumber}</Typography>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Statistics */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Statistics</Typography>
                            <Divider className="my-3" />
                            
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Typography variant="body2">Total Products</Typography>
                                    <Typography variant="h6">{vendor.stats?.totalProducts || 0}</Typography>
                                </div>
                                <div className="flex justify-between">
                                    <Typography variant="body2">Total Sales</Typography>
                                    <Typography variant="h6">{vendor.stats?.totalSales || 0}</Typography>
                                </div>
                                <div className="flex justify-between">
                                    <Typography variant="body2">Total Orders</Typography>
                                    <Typography variant="h6">{vendor.stats?.totalOrders || 0}</Typography>
                                </div>
                                <div className="flex justify-between">
                                    <Typography variant="body2">Average Rating</Typography>
                                    <Typography variant="h6">
                                        {vendor.stats?.averageRating?.toFixed(1) || '0.0'} ⭐
                                    </Typography>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mt-3">
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Earnings</Typography>
                            <Divider className="my-3" />
                            
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Typography variant="body2">Total Earnings</Typography>
                                    <Typography variant="h6" color="success.main">
                                        {formatCurrency(vendor.earnings?.totalEarnings || 0)}
                                    </Typography>
                                </div>
                                <div className="flex justify-between">
                                    <Typography variant="body2">Available Balance</Typography>
                                    <Typography variant="h6" color="primary.main">
                                        {formatCurrency(vendor.earnings?.availableBalance || 0)}
                                    </Typography>
                                </div>
                                <div className="flex justify-between">
                                    <Typography variant="body2">Pending Balance</Typography>
                                    <Typography variant="body2" color="warning.main">
                                        {formatCurrency(vendor.earnings?.pendingBalance || 0)}
                                    </Typography>
                                </div>
                                <div className="flex justify-between">
                                    <Typography variant="body2">Withdrawn</Typography>
                                    <Typography variant="body2">
                                        {formatCurrency(vendor.earnings?.withdrawnAmount || 0)}
                                    </Typography>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Contact Information */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Contact Information</Typography>
                            <Divider className="my-3" />
                            
                            <div className="space-y-3">
                                <div>
                                    <Typography variant="subtitle2" color="textSecondary">Email</Typography>
                                    <Typography variant="body1">{vendor.email}</Typography>
                                </div>
                                <div>
                                    <Typography variant="subtitle2" color="textSecondary">Phone</Typography>
                                    <Typography variant="body1">{vendor.phone}</Typography>
                                </div>
                                {vendor.website && (
                                    <div>
                                        <Typography variant="subtitle2" color="textSecondary">Website</Typography>
                                        <Typography variant="body1">
                                            <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                                                {vendor.website}
                                            </a>
                                        </Typography>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Address */}
                {vendor.address && (vendor.address.street || vendor.address.city) && (
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Business Address</Typography>
                                <Divider className="my-3" />
                                
                                <div className="space-y-1">
                                    {vendor.address.street && (
                                        <Typography variant="body2">{vendor.address.street}</Typography>
                                    )}
                                    <Typography variant="body2">
                                        {[vendor.address.city, vendor.address.state, vendor.address.zipCode]
                                            .filter(Boolean)
                                            .join(', ')}
                                    </Typography>
                                    {vendor.address.country && (
                                        <Typography variant="body2">{vendor.address.country}</Typography>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* Application Details */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Application Details</Typography>
                            <Divider className="my-3" />
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <Typography variant="subtitle2" color="textSecondary">Application Date</Typography>
                                    <Typography variant="body2">
                                        {vendor.applicationDate ? new Date(vendor.applicationDate).toLocaleDateString() : 'N/A'}
                                    </Typography>
                                </div>
                                {vendor.approvalDate && (
                                    <div>
                                        <Typography variant="subtitle2" color="textSecondary">Approval Date</Typography>
                                        <Typography variant="body2">
                                            {new Date(vendor.approvalDate).toLocaleDateString()}
                                        </Typography>
                                    </div>
                                )}
                                {vendor.rejectionDate && (
                                    <div>
                                        <Typography variant="subtitle2" color="textSecondary">Rejection Date</Typography>
                                        <Typography variant="body2">
                                            {new Date(vendor.rejectionDate).toLocaleDateString()}
                                        </Typography>
                                    </div>
                                )}
                                {vendor.approvedBy && (
                                    <div>
                                        <Typography variant="subtitle2" color="textSecondary">Approved By</Typography>
                                        <Typography variant="body2">
                                            {vendor.approvedBy?.name || 'N/A'}
                                        </Typography>
                                    </div>
                                )}
                            </div>
                            
                            {vendor.rejectionReason && (
                                <div className="mt-4">
                                    <Typography variant="subtitle2" color="textSecondary">Rejection Reason</Typography>
                                    <Typography variant="body2" className="text-red-600">
                                        {vendor.rejectionReason}
                                    </Typography>
                                </div>
                            )}

                            {vendor.adminNotes && (
                                <div className="mt-4">
                                    <Typography variant="subtitle2" color="textSecondary">Admin Notes</Typography>
                                    <Typography variant="body2">{vendor.adminNotes}</Typography>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </div>
    );
};

