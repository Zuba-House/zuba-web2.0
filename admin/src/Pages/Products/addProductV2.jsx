import React, { useContext, useEffect, useState } from 'react'
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Rating from '@mui/material/Rating';
import UploadBox from '../../Components/UploadBox';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { IoMdClose } from "react-icons/io";
import { Button } from '@mui/material';
import { FaCloudUploadAlt } from "react-icons/fa";
import { MyContext } from '../../App';
import { deleteImages, fetchDataFromApi, postData } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Switch from '@mui/material/Switch';

const label = { inputProps: { 'aria-label': 'Switch demo' } };

const AddProductV2 = () => {

    const [formFields, setFormFields] = useState({
        name: "",
        description: "",
        images: [],
        brand: "",
        price: "",
        salePrice: "",
        category: "",
        catName: "",
        catId: "",
        subCatId: "",
        subCat: "",
        thirdsubCat: "",
        thirdsubCatId: "",
        countInStock: "",
        rating: "",
        isFeatured: false,
        bannerTitleName: '',
        bannerimages: [],
        isDisplayOnHomeBanner: false,
        productType: "simple",
        attributes: []
    })

    const [productCat, setProductCat] = React.useState('');
    const [productSubCat, setProductSubCat] = React.useState('');
    const [productFeatured, setProductFeatured] = React.useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [productThirdLavelCat, setProductThirdLavelCat] = useState('');
    const [previews, setPreviews] = useState([]);
    const [bannerPreviews, setBannerPreviews] = useState([]);
    const [checkedSwitch, setCheckedSwitch] = useState(false);

    // New states for variable products
    const [productType, setProductType] = useState('simple');
    const [allAttributes, setAllAttributes] = useState([]);
    const [selectedAttributes, setSelectedAttributes] = useState([]);
    const [attributesMap, setAttributesMap] = useState({});

    const history = useNavigate();
    const context = useContext(MyContext);

    useEffect(() => {
        // Fetch attributes for variable products
        fetchDataFromApi("/api/attributes?isActive=true").then((res) => {
            if (res?.error === false) {
                setAllAttributes(res?.data || []);
            }
        })
    }, [])

    const handleChangeProductType = (event) => {
        const type = event.target.value;
        setProductType(type);
        setFormFields({ ...formFields, productType: type });
    }

    const handleAttributeSelect = (event) => {
        const { value } = event.target;
        setSelectedAttributes(value);
        setFormFields({ ...formFields, attributes: value });
    }

    const handleChangeProductCat = (event) => {
        setProductCat(event.target.value);
        formFields.catId = event.target.value
        formFields.category = event.target.value
    };

    const selectCatByName = (name) => {
        formFields.catName = name
    }

    const handleChangeProductSubCat = (event) => {
        setProductSubCat(event.target.value);
        formFields.subCatId = event.target.value
    };

    const selectSubCatByName = (name) => {
        formFields.subCat = name
    }

    const handleChangeProductThirdLavelCat = (event) => {
        setProductThirdLavelCat(event.target.value);
        formFields.thirdsubCatId = event.target.value
    };

    const selectSubCatByThirdLavel = (name) => {
        formFields.thirdsubCat = name
    }

    const handleChangeProductFeatured = (event) => {
        setProductFeatured(event.target.value);
        formFields.isFeatured = event.target.value
    };



    const onChangeInput = (e) => {
        const { name, value } = e.target;
        setFormFields(() => {
            return {
                ...formFields,
                [name]: value
            }
        })
    }

    const onChangeRating = (e) => {
        setFormFields((formFields) => (
            {
                ...formFields,
                rating: e.target.value
            }
        ))
    }

    const setPreviewsFun = (previewsArr) => {
        if (!Array.isArray(previewsArr) || previewsArr.length === 0) return;

        setPreviews((prev) => {
            const next = Array.isArray(prev) ? [...prev, ...previewsArr] : [...previewsArr];
            setFormFields((f) => ({ ...f, images: next }));
            return next;
        });
    }

    const setBannerImagesFun = (previewsArr) => {
        if (!Array.isArray(previewsArr) || previewsArr.length === 0) return;

        setBannerPreviews((prev) => {
            const next = Array.isArray(prev) ? [...prev, ...previewsArr] : [...previewsArr];
            setFormFields((f) => ({ ...f, bannerimages: next }));
            return next;
        });
    }

    const removeImg = (image, index) => {
        deleteImages(`/api/category/deteleImage?img=${image}`).then((res) => {
            setPreviews((prev) => {
                const next = prev?.filter((_, i) => i !== index) || [];
                setFormFields((f) => ({ ...f, images: next }));
                return next;
            });
        });
    }

    const removeBannerImg = (image, index) => {
        deleteImages(`/api/category/deteleImage?img=${image}`).then((res) => {
            setBannerPreviews((prev) => {
                const next = prev?.filter((_, i) => i !== index) || [];
                setFormFields((f) => ({ ...f, bannerimages: next }));
                return next;
            });
        });
    }

    const handleChangeSwitch = (event) => {
        setCheckedSwitch(event.target.checked);
        formFields.isDisplayOnHomeBanner = event.target.checked;
    }

    const handleSubmitg = (e) => {
        e.preventDefault(0);

        if (formFields.name === "") {
            context.alertBox("error", "Please enter product name");
            return false;
        }

        if (formFields.description === "") {
            context.alertBox("error", "Please enter product description");
            return false;
        }

        if (formFields?.catId === "") {
            context.alertBox("error", "Please select product category");
            return false;
        }

        // For simple products, require stock; for variable, variations will provide stock
        if (productType === "simple" && formFields?.countInStock === "") {
            context.alertBox("error", "Please enter product stock");
            return false;
        }

        if (formFields?.price === "") {
            context.alertBox("error", "Please enter product price");
            return false;
        }

        if (formFields?.brand === "") {
            context.alertBox("error", "Please enter product brand");
            return false;
        }

        if (formFields?.rating === "") {
            context.alertBox("error", "Please enter product rating");
            return false;
        }

        // For variable products, require attributes
        if (productType === "variable" && selectedAttributes.length === 0) {
            context.alertBox("error", "Please select at least one attribute for variable product");
            return false;
        }

        if (previews?.length === 0) {
            context.alertBox("error", "Please select product images");
            return false;
        }

        setIsLoading(true);

        postData("/api/product/create", formFields).then((res) => {
            if (res?.error === false) {
                context.alertBox("success", res?.message);
                setTimeout(() => {
                    setIsLoading(false);
                    context.setIsOpenFullScreenPanel({
                        open: false,
                    })
                    history("/products");
                }, 1000);
            } else {
                setIsLoading(false);
                context.alertBox("error", res?.message);
            }
        })
    }

    return (
        <section className='p-5 bg-gray-50'>
            <form className='form py-1 p-1 md:p-8 md:py-1' onSubmit={handleSubmitg}>
                <div className='scroll max-h-[72vh] overflow-y-scroll pr-4'>

                    {/* Product Type Selector */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 mb-4 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-200'>
                        <div className='col'>
                            <h3 className='text-[14px] font-[600] mb-2 text-black'>Product Type</h3>
                            <Select
                                size="small"
                                className='w-full'
                                value={productType}
                                onChange={handleChangeProductType}
                            >
                                <MenuItem value="simple">Simple Product (Standard)</MenuItem>
                                <MenuItem value="variable">Variable Product (Multiple Options)</MenuItem>
                            </Select>
                            <p className='text-[12px] text-gray-600 mt-1'>
                                {productType === "simple" 
                                    ? "Single product with fixed properties" 
                                    : "Product with multiple variations (color, size, etc.)"}
                            </p>
                        </div>

                        {productType === "variable" && (
                            <div className='col'>
                                <h3 className='text-[14px] font-[600] mb-2 text-black'>Select Attributes *</h3>
                                <Select
                                    multiple
                                    size="small"
                                    className='w-full'
                                    value={selectedAttributes}
                                    onChange={handleAttributeSelect}
                                >
                                    {allAttributes?.map((attr) => (
                                        <MenuItem key={attr._id} value={attr._id}>
                                            {attr.name} ({attr.type})
                                        </MenuItem>
                                    ))}
                                </Select>
                                <p className='text-[12px] text-gray-600 mt-1'>
                                    Select attributes to auto-generate variations
                                </p>
                            </div>
                        )}
                    </div>

                    <div className='grid grid-cols-1 mb-3'>
                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Product Name</h3>
                            <input type="text" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm' name="name" value={formFields.name} onChange={onChangeInput} />
                        </div>
                    </div>

                    <div className='grid grid-cols-1 mb-3'>
                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Product Description</h3>
                            <textarea type="text" className='w-full h-[140px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm' name="description" value={formFields.description} onChange={onChangeInput} />
                        </div>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-3 gap-4'>
                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Product Category</h3>
                            {context?.catData?.length !== 0 &&
                                <Select
                                    labelId="demo-simple-select-label"
                                    id="productCatDrop"
                                    size="small"
                                    className='w-full'
                                    value={productCat}
                                    label="Category"
                                    onChange={handleChangeProductCat}
                                >
                                    {context?.catData?.map((cat, index) => {
                                        return (
                                            <MenuItem key={cat?._id || index} value={cat?._id}
                                                onClick={() => selectCatByName(cat?.name)}>{cat?.name}</MenuItem>
                                        )
                                    })}
                                </Select>
                            }
                        </div>

                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Product Sub Category</h3>
                            {context?.catData?.length !== 0 &&
                                <Select
                                    labelId="demo-simple-select-label"
                                    id="productCatDrop"
                                    size="small"
                                    className='w-full'
                                    value={productSubCat}
                                    label="Sub Category"
                                    onChange={handleChangeProductSubCat}
                                >
                                    {context?.catData?.map((cat, index) => {
                                        return (
                                            cat?.children?.length !== 0 && cat?.children?.map((subCat, index_) => {
                                                return (
                                                    <MenuItem key={subCat?._id || index_} value={subCat?._id}
                                                        onClick={() => selectSubCatByName(subCat?.name)}
                                                    >
                                                        {subCat?.name}</MenuItem>
                                                )
                                            })
                                        )
                                    })}
                                </Select>
                            }
                        </div>

                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Product Third Level Category</h3>
                            {context?.catData?.length !== 0 &&
                                <Select
                                    labelId="demo-simple-select-label"
                                    id="productCatDrop"
                                    size="small"
                                    className='w-full'
                                    value={productThirdLavelCat}
                                    label="Sub Category"
                                    onChange={handleChangeProductThirdLavelCat}
                                >
                                    {context?.catData?.map((cat) => {
                                        return (
                                            cat?.children?.length !== 0 && cat?.children?.map((subCat) => {
                                                return (
                                                    subCat?.children?.length !== 0 && subCat?.children?.map((thirdLavelCat, index) => {
                                                        return <MenuItem key={thirdLavelCat?._id || index} value={thirdLavelCat?._id}
                                                            onClick={() => selectSubCatByThirdLavel(thirdLavelCat?.name)}>{thirdLavelCat?.name}</MenuItem>
                                                    })
                                                )
                                            })
                                        )
                                    })}
                                </Select>
                            }
                        </div>

                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Product Price</h3>
                            <input type="number" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm ' name="price" value={formFields.price} onChange={onChangeInput} />
                        </div>

                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Sale Price (Optional)</h3>
                            <input type="number" placeholder="Leave empty if no sale" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm ' name="salePrice" value={formFields.salePrice} onChange={onChangeInput} />
                        </div>

                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1  text-black'>Is Featured?</h3>
                            <Select
                                labelId="demo-simple-select-label"
                                id="productCatDrop"
                                size="small"
                                className='w-full'
                                value={productFeatured}
                                label="Category"
                                onChange={handleChangeProductFeatured}
                            >
                                <MenuItem value={true}>True</MenuItem>
                                <MenuItem value={false}>False</MenuItem>
                            </Select>
                        </div>

                        {productType === "simple" && (
                            <div className='col'>
                                <h3 className='text-[14px] font-[500] mb-1 text-black'>Product Stock</h3>
                                <input type="number" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm ' name="countInStock" value={formFields.countInStock} onChange={onChangeInput} />
                            </div>
                        )}

                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1 text-black'>Product Brand</h3>
                            <input type="text" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm ' name="brand" value={formFields.brand} onChange={onChangeInput} />
                        </div>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-4 mb-3 gap-4'>
                        <div className='col'>
                            <h3 className='text-[14px] font-[500] mb-1  text-black'>Product Rating </h3>
                            <Rating name="half-rating" defaultValue={1} onChange={onChangeRating} />
                        </div>
                    </div>

                    <div className='col w-full p-5 px-0'>
                        <h3 className="font-[700] text-[18px] mb-3">Media & Images</h3>
                        <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                            {previews?.length !== 0 && previews?.map((image, index) => {
                                return (
                                    <div className="uploadBoxWrapper relative" key={index}>
                                        <span className='absolute w-[20px] h-[20px] rounded-full  overflow-hidden bg-red-700 -top-[5px] -right-[5px] flex items-center justify-center z-50 cursor-pointer' onClick={() => removeImg(image, index)}><IoMdClose className='text-white text-[17px]' /></span>
                                        <div className='uploadBox p-0 rounded-md overflow-hidden border border-dashed border-[rgba(0,0,0,0.3)] h-[150px] w-[100%] bg-gray-100 cursor-pointer hover:bg-gray-200 flex items-center justify-center flex-col relative'>
                                            <img src={image} className='w-100' />
                                        </div>
                                    </div>
                                )
                            })}
                            <UploadBox multiple={true} name="images" url="/api/product/uploadImages" setPreviewsFun={setPreviewsFun} />
                        </div>
                    </div>

                    <div className='col w-full p-5 px-0'>
                        <div className='bg-gray-100 p-4 w-full'>
                            <div className="flex items-center gap-8">
                                <h3 className="font-[700] text-[18px] mb-3">Banner Images</h3>
                                <Switch {...label} onChange={handleChangeSwitch} checked={checkedSwitch} />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                                {bannerPreviews?.length !== 0 && bannerPreviews?.map((image, index) => {
                                    return (
                                        <div className="uploadBoxWrapper relative" key={index}>
                                            <span className='absolute w-[20px] h-[20px] rounded-full  overflow-hidden bg-red-700 -top-[5px] -right-[5px] flex items-center justify-center z-50 cursor-pointer' onClick={() => removeBannerImg(image, index)}><IoMdClose className='text-white text-[17px]' /></span>
                                            <div className='uploadBox p-0 rounded-md overflow-hidden border border-dashed border-[rgba(0,0,0,0.3)] h-[150px] w-[100%] bg-gray-100 cursor-pointer hover:bg-gray-200 flex items-center justify-center flex-col relative'>
                                                <img src={image} className='w-100' />
                                            </div>
                                        </div>
                                    )
                                })}
                                <UploadBox multiple={true} name="bannerimages" url="/api/product/uploadBannerImages" setPreviewsFun={setBannerImagesFun} />
                            </div>

                            <br />

                            <h3 className="font-[700] text-[18px] mb-3">Banner Title</h3>
                            <input type="text" className='w-full h-[40px] border border-[rgba(0,0,0,0.2)] focus:outline-none focus:border-[rgba(0,0,0,0.4)] rounded-sm p-3 text-sm' name="bannerTitleName" value={formFields.bannerTitleName} onChange={onChangeInput} />
                        </div>
                    </div>

                    {productType === "variable" && (
                        <div className='col w-full p-5 px-0 bg-blue-50 border-2 border-blue-200 rounded-lg'>
                            <h3 className="font-[700] text-[16px] mb-2 text-blue-900">📊 Variable Product Notice</h3>
                            <p className='text-[14px] text-blue-800 mb-3'>
                                After creating this product, you'll need to:
                            </p>
                            <ul className='text-[14px] text-blue-800 ml-4 list-disc'>
                                <li>Go to Variations Manager to create variations</li>
                                <li>Click "Auto-Generate" to create all combinations</li>
                                <li>Set prices and stock for each variation</li>
                                <li>Upload images for each variation (optional)</li>
                            </ul>
                        </div>
                    )}

                </div>

                <hr />
                <br />
                <Button type="submit" className="btn-blue btn-lg w-full flex gap-2">
                    {isLoading === true ? <CircularProgress color="inherit" />
                        :
                        <>
                            <FaCloudUploadAlt className='text-[25px] text-white' />
                            Publish {productType === "variable" ? "Variable" : "Simple"} Product
                        </>
                    }
                </Button>

            </form>
        </section>
    )
}

export default AddProductV2;
