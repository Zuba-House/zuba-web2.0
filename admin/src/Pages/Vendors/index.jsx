import React, { useContext, useEffect, useState } from 'react';
import { Button } from "@mui/material";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import { Link } from "react-router-dom";
import { AiOutlineEdit, AiOutlineEye } from "react-icons/ai";
import { GoCheck, GoX } from "react-icons/go";
import { MdBlock, MdCheckCircle, MdDelete } from "react-icons/md";
import SearchBox from '../../Components/SearchBox';
import { MyContext } from '../../App';
import { fetchDataFromApi, postData, deleteData } from '../../utils/api';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Badge from '@mui/material/Badge';
import { formatCurrency } from '../../utils/currency';

const columns = [
    { id: "shopName", label: "SHOP NAME", minWidth: 150 },
    { id: "vendor", label: "VENDOR", minWidth: 150 },
    { id: "businessType", label: "TYPE", minWidth: 100 },
    { id: "status", label: "STATUS", minWidth: 120 },
    { id: "verified", label: "VERIFIED", minWidth: 100 },
    { id: "products", label: "PRODUCTS", minWidth: 100 },
    { id: "earnings", label: "EARNINGS", minWidth: 120 },
    { id: "date", label: "APPLIED", minWidth: 120 },
    { id: "action", label: "ACTION", minWidth: 200 },
];

const getStatusColor = (status) => {
    switch (status) {
        case 'approved':
            return 'success';
        case 'pending':
            return 'warning';
        case 'rejected':
            return 'error';
        case 'suspended':
            return 'error';
        case 'inactive':
            return 'default';
        default:
            return 'default';
    }
};

const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
};

export const Vendors = () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [vendorData, setVendorData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });

    const context = useContext(MyContext);

    useEffect(() => {
        getVendors();
    }, [page, statusFilter]);

    const getVendors = async () => {
        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: (page + 1).toString(),
                limit: rowsPerPage.toString(),
            });
            
            if (statusFilter !== 'all') {
                queryParams.append('status', statusFilter);
            }

            const res = await fetchDataFromApi(`/api/vendors/admin/all?${queryParams}`);
            if (res?.success && res?.vendors) {
                setVendorData(res.vendors);
                if (res.pagination) {
                    setPagination(res.pagination);
                }
            } else {
                context?.alertBox("error", res?.error || "Failed to load vendors");
            }
        } catch (error) {
            console.error('Error fetching vendors:', error);
            context?.alertBox("error", "Failed to load vendors");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (vendorId) => {
        if (!window.confirm('Are you sure you want to approve this vendor?')) {
            return;
        }

        try {
            const res = await postData(`/api/vendors/admin/${vendorId}/approve`, {});
            if (res?.success) {
                context?.alertBox("success", "Vendor approved successfully");
                getVendors();
            } else {
                context?.alertBox("error", res?.error || "Failed to approve vendor");
            }
        } catch (error) {
            console.error('Error approving vendor:', error);
            context?.alertBox("error", "Failed to approve vendor");
        }
    };

    const handleReject = async (vendorId) => {
        const reason = window.prompt('Please provide a reason for rejection:');
        if (!reason) {
            return;
        }

        try {
            const res = await postData(`/api/vendors/admin/${vendorId}/reject`, { reason });
            if (res?.success) {
                context?.alertBox("success", "Vendor rejected successfully");
                getVendors();
            } else {
                context?.alertBox("error", res?.error || "Failed to reject vendor");
            }
        } catch (error) {
            console.error('Error rejecting vendor:', error);
            context?.alertBox("error", "Failed to reject vendor");
        }
    };

    const handleSuspend = async (vendorId) => {
        const reason = window.prompt('Please provide a reason for suspension:');
        if (!reason) {
            return;
        }

        if (!window.confirm('Are you sure you want to suspend this vendor?')) {
            return;
        }

        try {
            const res = await postData(`/api/vendors/admin/${vendorId}/suspend`, { reason });
            if (res?.success) {
                context?.alertBox("success", "Vendor suspended successfully");
                getVendors();
            } else {
                context?.alertBox("error", res?.error || "Failed to suspend vendor");
            }
        } catch (error) {
            console.error('Error suspending vendor:', error);
            context?.alertBox("error", "Failed to suspend vendor");
        }
    };

    const handleActivate = async (vendorId) => {
        if (!window.confirm('Are you sure you want to activate/reactivate this vendor?')) {
            return;
        }

        try {
            const res = await postData(`/api/vendors/admin/${vendorId}/activate`, {});
            if (res?.success) {
                context?.alertBox("success", "Vendor activated successfully");
                getVendors();
            } else {
                context?.alertBox("error", res?.error || "Failed to activate vendor");
            }
        } catch (error) {
            console.error('Error activating vendor:', error);
            context?.alertBox("error", "Failed to activate vendor");
        }
    };

    const handleDelete = async (vendorId, shopName) => {
        if (!window.confirm(`Are you sure you want to DELETE vendor "${shopName}"? This action cannot be undone and will only work if the vendor has no products or earnings.`)) {
            return;
        }

        if (!window.confirm('This is a permanent action. Are you absolutely sure?')) {
            return;
        }

        try {
            const res = await deleteData(`/api/vendors/admin/${vendorId}`);
            if (res?.success) {
                context?.alertBox("success", "Vendor deleted successfully");
                getVendors();
            } else {
                context?.alertBox("error", res?.error || "Failed to delete vendor");
            }
        } catch (error) {
            console.error('Error deleting vendor:', error);
            context?.alertBox("error", error.response?.data?.error || "Failed to delete vendor");
        }
    };

    const filteredVendors = vendorData.filter((vendor) => {
        const matchesSearch = searchQuery === "" ||
            vendor.shopName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vendor.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vendor.userId?.email?.toLowerCase().includes(searchQuery.toLowerCase());
        
        return matchesSearch;
    });

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-[26px] font-bold">Vendors</h1>
                <div className="flex items-center gap-4">
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPage(0);
                        }}
                        className="px-4 py-2 border rounded-md"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="suspended">Suspended</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <SearchBox
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <CircularProgress />
                </div>
            ) : (
                <div className="card shadow-md sm:rounded-lg bg-white">
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    {columns.map((column) => (
                                        <TableCell
                                            key={column.id}
                                            style={{ minWidth: column.minWidth, fontWeight: 'bold' }}
                                        >
                                            {column.label}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredVendors.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} align="center" className="py-10">
                                            No vendors found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredVendors.map((vendor) => (
                                        <TableRow key={vendor._id} hover>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {vendor.shopLogo && (
                                                        <img
                                                            src={vendor.shopLogo}
                                                            alt={vendor.shopName}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="font-medium">{vendor.shopName}</div>
                                                        {vendor.shopSlug && (
                                                            <div className="text-xs text-gray-500">
                                                                /vendor/{vendor.shopSlug}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">
                                                        {vendor.userId?.name || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {vendor.userId?.email || 'N/A'}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="capitalize">{vendor.businessType || 'N/A'}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={getStatusLabel(vendor.status)}
                                                    color={getStatusColor(vendor.status)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    {vendor.isVerified ? (
                                                        <Chip label="Verified" color="success" size="small" />
                                                    ) : (
                                                        <Chip label="Not Verified" color="default" size="small" />
                                                    )}
                                                    {vendor.emailVerified ? (
                                                        <Chip label="Email Verified" color="success" size="small" variant="outlined" />
                                                    ) : (
                                                        <Chip label="Email Not Verified" color="warning" size="small" variant="outlined" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge badgeContent={vendor.stats?.totalProducts || 0} color="primary">
                                                    <span>Products</span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {formatCurrency(vendor.earnings?.totalEarnings || 0)}
                                            </TableCell>
                                            <TableCell>
                                                {formatDate(vendor.applicationDate)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Link to={`/vendors/${vendor._id}`}>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            startIcon={<AiOutlineEye />}
                                                        >
                                                            View
                                                        </Button>
                                                    </Link>
                                                    
                                                    {vendor.status === 'pending' && (
                                                        <>
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                color="success"
                                                                startIcon={<GoCheck />}
                                                                onClick={() => handleApprove(vendor._id)}
                                                            >
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                color="error"
                                                                startIcon={<GoX />}
                                                                onClick={() => handleReject(vendor._id)}
                                                            >
                                                                Reject
                                                            </Button>
                                                        </>
                                                    )}

                                                    {vendor.status === 'approved' && (
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="warning"
                                                            startIcon={<MdBlock />}
                                                            onClick={() => handleSuspend(vendor._id)}
                                                        >
                                                            Suspend
                                                        </Button>
                                                    )}

                                                    {(vendor.status === 'suspended' || vendor.status === 'inactive') && (
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="success"
                                                            startIcon={<MdCheckCircle />}
                                                            onClick={() => handleActivate(vendor._id)}
                                                        >
                                                            Activate
                                                        </Button>
                                                    )}

                                                    {vendor.status !== 'pending' && (
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="error"
                                                            startIcon={<MdDelete />}
                                                            onClick={() => handleDelete(vendor._id, vendor.shopName)}
                                                        >
                                                            Delete
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
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        component="div"
                        count={pagination.total || filteredVendors.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </div>
            )}
        </div>
    );
};

