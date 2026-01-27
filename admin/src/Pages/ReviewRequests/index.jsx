import React, { useContext, useEffect, useState } from 'react';
import { Button, Switch, Chip } from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import { MyContext } from '../../App';
import { fetchDataFromApi, postData, editData } from '../../utils/api';
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import SearchBox from '../../Components/SearchBox';
import CircularProgress from '@mui/material/CircularProgress';
import { FaCheck, FaTimes, FaEnvelope, FaEye } from "react-icons/fa";
import Rating from '@mui/material/Rating';
import Badge from '../../Components/Badge';

const columns = [
    { id: "product", label: "PRODUCT", minWidth: 200 },
    { id: "customer", label: "CUSTOMER", minWidth: 150 },
    { id: "order", label: "ORDER", minWidth: 120 },
    { id: "status", label: "STATUS", minWidth: 120 },
    { id: "adminStatus", label: "ADMIN STATUS", minWidth: 140 },
    { id: "review", label: "REVIEW", minWidth: 200 },
    { id: "action", label: "ACTION", minWidth: 150 },
];

const getStatusColor = (status) => {
    switch (status) {
        case 'sent':
            return 'primary';
        case 'reviewed':
            return 'success';
        case 'expired':
            return 'error';
        case 'cancelled':
            return 'default';
        default:
            return 'warning';
    }
};

const getAdminStatusColor = (status) => {
    switch (status) {
        case 'approved':
            return 'success';
        case 'rejected':
            return 'error';
        default:
            return 'warning';
    }
};

export const ReviewRequests = () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [reviewRequests, setReviewRequests] = useState([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [adminStatusFilter, setAdminStatusFilter] = useState("");

    const context = useContext(MyContext);

    useEffect(() => {
        fetchReviewRequests();
    }, [page, rowsPerPage, statusFilter, adminStatusFilter, searchQuery]);

    const fetchReviewRequests = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: (page + 1).toString(),
                limit: rowsPerPage.toString(),
            });
            
            if (statusFilter) params.append('status', statusFilter);
            if (adminStatusFilter) params.append('adminStatus', adminStatusFilter);
            if (searchQuery) params.append('search', searchQuery);

            const res = await fetchDataFromApi(`/api/review-requests?${params.toString()}`);
            
            if (res?.error === false && res?.data) {
                setReviewRequests(res.data.reviewRequests || []);
                setTotal(res.data.pagination?.total || 0);
            } else {
                context.alertBox("error", res?.message || "Failed to fetch review requests");
            }
        } catch (error) {
            console.error('Error fetching review requests:', error);
            context.alertBox("error", "Failed to fetch review requests");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendReviewRequests = async () => {
        if (!window.confirm('Send review requests to all eligible customers with delivered orders?')) {
            return;
        }

        setIsLoading(true);
        try {
            const res = await postData('/api/review-requests/send', {});
            if (res?.error === false) {
                context.alertBox("success", res?.message || "Review requests sent successfully");
                fetchReviewRequests();
            } else {
                context.alertBox("error", res?.message || "Failed to send review requests");
            }
        } catch (error) {
            console.error('Error sending review requests:', error);
            context.alertBox("error", "Failed to send review requests");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (id) => {
        setIsLoading(true);
        try {
            const res = await postData(`/api/review-requests/${id}/approve`, {});
            if (res?.error === false) {
                context.alertBox("success", "Review request approved successfully");
                fetchReviewRequests();
            } else {
                context.alertBox("error", res?.message || "Failed to approve review request");
            }
        } catch (error) {
            console.error('Error approving review request:', error);
            context.alertBox("error", "Failed to approve review request");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async (id) => {
        const reason = window.prompt('Enter rejection reason (optional):');
        setIsLoading(true);
        try {
            const res = await postData(`/api/review-requests/${id}/reject`, { reason: reason || '' });
            if (res?.error === false) {
                context.alertBox("success", "Review request rejected successfully");
                fetchReviewRequests();
            } else {
                context.alertBox("error", res?.message || "Failed to reject review request");
            }
        } catch (error) {
            console.error('Error rejecting review request:', error);
            context.alertBox("error", "Failed to reject review request");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const filteredRequests = reviewRequests.filter(request => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            request.productName?.toLowerCase().includes(query) ||
            request.customerName?.toLowerCase().includes(query) ||
            request.customerEmail?.toLowerCase().includes(query) ||
            request.orderNumber?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5', padding: '20px' }}>
            <div className="flex items-center justify-between px-2 py-0 mt-3">
                <h2 className="text-[18px] font-[600]">
                    Review Requests
                    <span className="font-[400] text-[14px] ml-2">({total} total)</span>
                </h2>

                <div className="flex items-center gap-3">
                    <Button 
                        className="btn-blue !text-white btn-sm" 
                        onClick={handleSendReviewRequests}
                        disabled={isLoading}
                    >
                        Send Review Requests
                    </Button>
                </div>
            </div>

            <div className="card my-4 pt-5 shadow-md sm:rounded-lg bg-white">
                <div className="px-4 pb-4 flex items-center gap-4">
                    <SearchBox 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by product, customer, email, or order..."
                    />
                    
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border rounded"
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="sent">Sent</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="expired">Expired</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <select
                        value={adminStatusFilter}
                        onChange={(e) => setAdminStatusFilter(e.target.value)}
                        className="px-3 py-2 border rounded"
                    >
                        <option value="">All Admin Statuses</option>
                        <option value="pending">Pending Approval</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>

                {isLoading && (
                    <div className="flex justify-center py-8">
                        <CircularProgress />
                    </div>
                )}

                {!isLoading && (
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader aria-label="sticky table">
                            <TableHead>
                                <TableRow>
                                    {columns.map((column) => (
                                        <TableCell
                                            key={column.id}
                                            align={column.align}
                                            style={{ minWidth: column.minWidth }}
                                        >
                                            {column.label}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRequests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} align="center" className="py-8">
                                            No review requests found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRequests.map((request) => (
                                        <TableRow hover role="checkbox" tabIndex={-1} key={request._id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <LazyLoadImage
                                                        src={request.productImage || request.productId?.images?.[0]?.url || '/placeholder.png'}
                                                        alt={request.productName}
                                                        effect="blur"
                                                        className="w-12 h-12 object-cover rounded"
                                                    />
                                                    <div>
                                                        <div className="font-medium">{request.productName}</div>
                                                        {request.emailSent && (
                                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                                <FaEnvelope className="text-xs" />
                                                                {new Date(request.emailSentAt).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{request.customerName}</div>
                                                    <div className="text-xs text-gray-500">{request.customerEmail}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">#{request.orderNumber}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={request.status} 
                                                    color={getStatusColor(request.status)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={request.adminStatus} 
                                                    color={getAdminStatusColor(request.adminStatus)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {request.reviewId ? (
                                                    <div>
                                                        <Rating value={request.reviewId?.rating || 0} readOnly size="small" />
                                                        <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                            {request.reviewId?.review || 'No review text'}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">Not submitted</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {request.adminStatus === 'pending' && (
                                                        <>
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                color="success"
                                                                onClick={() => handleApprove(request._id)}
                                                                disabled={isLoading}
                                                            >
                                                                <FaCheck className="mr-1" />
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                color="error"
                                                                onClick={() => handleReject(request._id)}
                                                                disabled={isLoading}
                                                            >
                                                                <FaTimes className="mr-1" />
                                                                Reject
                                                            </Button>
                                                        </>
                                                    )}
                                                    {request.reviewId && (
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => window.open(`/products/${request.productId?._id || request.productId}`, '_blank')}
                                                        >
                                                            <FaEye className="mr-1" />
                                                            View
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <TablePagination
                    rowsPerPageOptions={[10, 20, 50, 100]}
                    component="div"
                    count={total}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </div>
        </div>
    );
};

export default ReviewRequests;

