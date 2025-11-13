import React, { useContext, useEffect, useState } from 'react';
import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem } from '@mui/material';
import { MdEdit, MdDelete, MdAdd } from 'react-icons/md';
import { fetchDataFromApi, postData, putData, deleteData } from '../../utils/api';
import { MyContext } from '../../App';

const AttributesManager = () => {
    const [attributes, setAttributes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        type: 'select',
        description: '',
        visibility: 'both',
        isActive: true
    });

    const context = useContext(MyContext);

    useEffect(() => {
        fetchAttributes();
    }, []);

    const fetchAttributes = () => {
        setLoading(true);
        fetchDataFromApi("/api/attributes?isActive=true").then((res) => {
            if (res?.error === false) {
                setAttributes(res?.data || []);
            } else {
                context.alertBox("error", "Failed to fetch attributes");
            }
            setLoading(false);
        }).catch(() => {
            context.alertBox("error", "Error fetching attributes");
            setLoading(false);
        });
    };

    const handleOpenDialog = (attribute = null) => {
        if (attribute) {
            setEditingId(attribute._id);
            setFormData({
                name: attribute.name,
                type: attribute.type,
                description: attribute.description,
                visibility: attribute.visibility,
                isActive: attribute.isActive
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                type: 'select',
                description: '',
                visibility: 'both',
                isActive: true
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingId(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = () => {
        if (!formData.name.trim()) {
            context.alertBox("error", "Attribute name is required");
            return;
        }

        if (editingId) {
            // Update
            putData(`/api/attributes/${editingId}`, formData).then((res) => {
                if (res?.error === false) {
                    context.alertBox("success", "Attribute updated successfully");
                    fetchAttributes();
                    handleCloseDialog();
                } else {
                    context.alertBox("error", res?.message || "Failed to update attribute");
                }
            }).catch(() => {
                context.alertBox("error", "Error updating attribute");
            });
        } else {
            // Create
            postData("/api/attributes", formData).then((res) => {
                if (res?.error === false) {
                    context.alertBox("success", "Attribute created successfully");
                    fetchAttributes();
                    handleCloseDialog();
                } else {
                    context.alertBox("error", res?.message || "Failed to create attribute");
                }
            }).catch(() => {
                context.alertBox("error", "Error creating attribute");
            });
        }
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this attribute?")) {
            deleteData(`/api/attributes/${id}`).then((res) => {
                if (res?.error === false) {
                    context.alertBox("success", "Attribute deleted successfully");
                    fetchAttributes();
                } else {
                    context.alertBox("error", res?.message || "Failed to delete attribute");
                }
            }).catch(() => {
                context.alertBox("error", "Error deleting attribute");
            });
        }
    };

    return (
        <div className='p-6 bg-gray-50 rounded-lg'>
            <div className='flex justify-between items-center mb-6'>
                <h2 className='text-[28px] font-bold text-gray-800'>Attributes Manager</h2>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<MdAdd />}
                    onClick={() => handleOpenDialog()}
                    className='bg-blue-600'
                >
                    Add Attribute
                </Button>
            </div>

            {loading ? (
                <div className='text-center py-10'>Loading...</div>
            ) : attributes.length === 0 ? (
                <div className='text-center py-10 bg-white rounded-lg border border-gray-200'>
                    <p className='text-gray-500'>No attributes found. Create your first attribute!</p>
                </div>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead className='bg-gray-200'>
                            <TableRow>
                                <TableCell className='font-bold'>Name</TableCell>
                                <TableCell className='font-bold'>Type</TableCell>
                                <TableCell className='font-bold'>Visibility</TableCell>
                                <TableCell className='font-bold'>Status</TableCell>
                                <TableCell className='font-bold'>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {attributes.map((attr) => (
                                <TableRow key={attr._id} className='hover:bg-gray-50'>
                                    <TableCell>{attr.name}</TableCell>
                                    <TableCell>
                                        <span className='bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm'>
                                            {attr.type}
                                        </span>
                                    </TableCell>
                                    <TableCell>{attr.visibility}</TableCell>
                                    <TableCell>
                                        <span className={`px-3 py-1 rounded-full text-sm ${attr.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {attr.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className='flex gap-2'>
                                            <Button
                                                size="small"
                                                startIcon={<MdEdit />}
                                                onClick={() => handleOpenDialog(attr)}
                                                className='text-blue-600'
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="small"
                                                startIcon={<MdDelete />}
                                                onClick={() => handleDelete(attr._id)}
                                                className='text-red-600'
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Dialog for Create/Edit */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle className='bg-blue-600 text-white font-bold'>
                    {editingId ? 'Edit Attribute' : 'Create New Attribute'}
                </DialogTitle>
                <DialogContent className='mt-4'>
                    <TextField
                        fullWidth
                        label="Attribute Name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        margin="normal"
                        placeholder="e.g., Color, Size, Material"
                    />

                    <Select
                        fullWidth
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        margin="dense"
                        className='mt-2'
                    >
                        <MenuItem value="select">Select Dropdown</MenuItem>
                        <MenuItem value="color_swatch">Color Swatch</MenuItem>
                        <MenuItem value="image_swatch">Image Swatch</MenuItem>
                        <MenuItem value="button">Button</MenuItem>
                    </Select>

                    <TextField
                        fullWidth
                        label="Description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        margin="normal"
                        multiline
                        rows={3}
                    />

                    <Select
                        fullWidth
                        name="visibility"
                        value={formData.visibility}
                        onChange={handleInputChange}
                        margin="dense"
                        className='mt-2'
                    >
                        <MenuItem value="shop">Show in Shop Only</MenuItem>
                        <MenuItem value="filter">Show in Filters Only</MenuItem>
                        <MenuItem value="both">Show in Both</MenuItem>
                    </Select>
                </DialogContent>
                <DialogActions className='p-4'>
                    <Button onClick={handleCloseDialog} className='text-gray-600'>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} variant="contained" className='bg-blue-600 text-white'>
                        {editingId ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default AttributesManager;
