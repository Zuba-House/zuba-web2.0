import ProductModel from '../models/product.model.js';
import ProductRAMSModel from '../models/productRAMS.js';
import ProductWEIGHTModel from '../models/productWEIGHT.js';
import ProductSIZEModel from '../models/productSIZE.js';

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import { request } from 'http';


cloudinary.config({
    cloud_name: process.env.cloudinary_Config_Cloud_Name,
    api_key: process.env.cloudinary_Config_api_key,
    api_secret: process.env.cloudinary_Config_api_secret,
    secure: true,
});


//image upload
var imagesArr = [];
export async function uploadImages(request, response) {
    try {
        imagesArr = [];

        const image = request.files;

        if (!image || image.length === 0) {
            return response.status(400).json({
                error: true,
                success: false,
                message: "No images provided"
            });
        }

        const options = {
            use_filename: true,
            unique_filename: false,
            overwrite: false,
        };

        // Use Promise.all to wait for all uploads to complete
        const uploadPromises = [];
        for (let i = 0; i < image.length; i++) {
            uploadPromises.push(
                cloudinary.uploader.upload(image[i].path, options)
                    .then((result) => {
                        // Delete the temporary file
                        try {
                            fs.unlinkSync(`uploads/${image[i].filename}`);
                        } catch (unlinkError) {
                            console.error('Error deleting temp file:', unlinkError);
                        }
                        return result.secure_url;
                    })
                    .catch((error) => {
                        console.error('Cloudinary upload error:', error);
                        // Delete temp file even on error
                        try {
                            fs.unlinkSync(`uploads/${image[i].filename}`);
                        } catch (unlinkError) {
                            console.error('Error deleting temp file:', unlinkError);
                        }
                        throw error;
                    })
            );
        }

        // Wait for all uploads to complete
        const uploadedUrls = await Promise.all(uploadPromises);
        imagesArr = uploadedUrls;

        return response.status(200).json({
            error: false,
            success: true,
            data: {
                images: imagesArr
            }
        });

    } catch (error) {
        console.error('Upload images error:', error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

var bannerImage = [];
export async function uploadBannerImages(request, response) {
    try {
        bannerImage = [];

        const image = request.files;

        if (!image || image.length === 0) {
            return response.status(400).json({
                error: true,
                success: false,
                message: "No images provided"
            });
        }

        const options = {
            use_filename: true,
            unique_filename: false,
            overwrite: false,
        };

        // Use Promise.all to wait for all uploads to complete
        const uploadPromises = [];
        for (let i = 0; i < image.length; i++) {
            uploadPromises.push(
                cloudinary.uploader.upload(image[i].path, options)
                    .then((result) => {
                        // Delete the temporary file
                        try {
                            fs.unlinkSync(`uploads/${image[i].filename}`);
                        } catch (unlinkError) {
                            console.error('Error deleting temp file:', unlinkError);
                        }
                        return result.secure_url;
                    })
                    .catch((error) => {
                        console.error('Cloudinary upload error:', error);
                        // Delete temp file even on error
                        try {
                            fs.unlinkSync(`uploads/${image[i].filename}`);
                        } catch (unlinkError) {
                            console.error('Error deleting temp file:', unlinkError);
                        }
                        throw error;
                    })
            );
        }

        // Wait for all uploads to complete
        const uploadedUrls = await Promise.all(uploadPromises);
        bannerImage = uploadedUrls;

        return response.status(200).json({
            error: false,
            success: true,
            data: {
                images: bannerImage
            }
        });

    } catch (error) {
        console.error('Upload banner images error:', error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


//create product
export async function createProduct(request, response) {
    try {
        // Get images from request body (form) or from global imagesArr (upload endpoint)
        let productImages = [];
        
        // Check request body first (from form submission)
        if (request.body.images) {
            if (Array.isArray(request.body.images) && request.body.images.length > 0) {
                productImages = request.body.images;
            } else if (typeof request.body.images === 'string') {
                // Handle case where images might be a JSON string
                try {
                    const parsed = JSON.parse(request.body.images);
                    if (Array.isArray(parsed)) {
                        productImages = parsed;
                    }
                } catch (e) {
                    // Not JSON, treat as single URL
                    productImages = [request.body.images];
                }
            }
        }
        
        // Fallback to global imagesArr if no images in request body
        if (productImages.length === 0 && imagesArr && imagesArr.length > 0) {
            productImages = imagesArr;
        }
        
        // Transform images array to new format
        const imagesFormatted = productImages
            .filter(img => img && (typeof img === 'string' || (typeof img === 'object' && img.url))) // Filter out invalid entries
            .map((img, index) => {
                // If already an object, use it
                if (typeof img === 'object' && img.url) {
                    return {
                        url: img.url,
                        alt: img.alt || '',
                        title: img.title || '',
                        position: img.position !== undefined ? img.position : index,
                        isFeatured: img.isFeatured !== undefined ? img.isFeatured : index === 0
                    };
                }
                // If string URL, convert to object
                return {
                    url: typeof img === 'string' ? img : '',
                    alt: '',
                    title: '',
                    position: index,
                    isFeatured: index === 0
                };
            });

        // Get banner images
        let bannerImages = [];
        if (request.body.bannerimages && Array.isArray(request.body.bannerimages) && request.body.bannerimages.length > 0) {
            bannerImages = request.body.bannerimages;
        } else if (bannerImage && bannerImage.length > 0) {
            bannerImages = bannerImage;
        }

        // Handle pricing - support both new structure and legacy
        let pricingData = {};
        if (request.body.pricing && typeof request.body.pricing === 'object') {
            pricingData = {
                regularPrice: request.body.pricing.regularPrice || request.body.oldPrice || request.body.price || 0,
                salePrice: request.body.pricing.salePrice || null,
                price: request.body.pricing.salePrice || request.body.pricing.regularPrice || request.body.price || request.body.oldPrice || 0,
                currency: request.body.pricing.currency || request.body.currency || 'USD',
                onSale: request.body.pricing.onSale || (request.body.pricing.salePrice && request.body.pricing.salePrice < request.body.pricing.regularPrice),
                taxStatus: request.body.pricing.taxStatus || 'taxable',
                taxClass: request.body.pricing.taxClass || 'standard'
            };
        } else {
            pricingData = {
                regularPrice: request.body.oldPrice || request.body.price || 0,
                salePrice: request.body.oldPrice && request.body.price && request.body.price < request.body.oldPrice ? request.body.price : null,
                price: request.body.price || request.body.oldPrice || 0,
                currency: request.body.currency || 'USD',
                onSale: request.body.oldPrice && request.body.price && request.body.price < request.body.oldPrice,
                taxStatus: 'taxable',
                taxClass: 'standard'
            };
        }

        // Handle inventory - support both new structure and legacy
        let inventoryData = {};
        if (request.body.inventory && typeof request.body.inventory === 'object') {
            inventoryData = {
                stock: request.body.inventory.stock || request.body.countInStock || 0,
                stockStatus: request.body.inventory.stockStatus || ((request.body.inventory.stock || request.body.countInStock || 0) > 0 ? 'in_stock' : 'out_of_stock'),
                manageStock: request.body.inventory.manageStock !== false,
                allowBackorders: request.body.inventory.allowBackorders || 'no',
                lowStockThreshold: request.body.inventory.lowStockThreshold || 5,
                soldIndividually: request.body.inventory.soldIndividually || false
            };
        } else {
            inventoryData = {
                stock: request.body.countInStock || 0,
                stockStatus: (request.body.countInStock || 0) > 0 ? 'in_stock' : 'out_of_stock',
                manageStock: true,
                allowBackorders: 'no',
                lowStockThreshold: 5,
                soldIndividually: false
            };
        }

        // Handle shipping
        let shippingData = {};
        if (request.body.shipping && typeof request.body.shipping === 'object') {
            shippingData = {
                weight: request.body.shipping.weight || null,
                weightUnit: request.body.shipping.weightUnit || 'kg',
                dimensions: request.body.shipping.dimensions || {
                    length: null,
                    width: null,
                    height: null,
                    unit: 'cm'
                },
                shippingClass: request.body.shipping.shippingClass || 'standard',
                freeShipping: request.body.shipping.freeShipping || false
            };
        }

        // Handle SEO - support both new structure and legacy
        let seoData = {};
        if (request.body.seo && typeof request.body.seo === 'object') {
            seoData = {
                metaTitle: request.body.seo.metaTitle || request.body.name || '',
                metaDescription: request.body.seo.metaDescription || request.body.description?.substring(0, 160) || '',
                metaKeywords: request.body.seo.metaKeywords || [],
                slug: request.body.seo.slug || null
            };
        } else {
            seoData = {
                metaTitle: request.body.metaTitle || request.body.name || '',
                metaDescription: request.body.metaDescription || request.body.description?.substring(0, 160) || '',
                metaKeywords: request.body.metaKeywords || [],
                slug: request.body.slug || null
            };
        }

        // Build product data with backward compatibility
        const productData = {
            name: request.body.name,
            description: request.body.description,
            shortDescription: request.body.shortDescription || '',
            brand: request.body.brand || '',
            category: request.body.category || request.body.catId,
            catName: request.body.catName || '',
            catId: request.body.catId || '',
            subCatId: request.body.subCatId || '',
            subCat: request.body.subCat || '',
            thirdsubCat: request.body.thirdsubCat || '',
            thirdsubCatId: request.body.thirdsubCatId || '',
            isFeatured: request.body.isFeatured || false,
            bannerimages: bannerImages,
            bannerTitleName: request.body.bannerTitleName || '',
            isDisplayOnHomeBanner: request.body.isDisplayOnHomeBanner || false,
            productRam: request.body.productRam || [],
            size: request.body.size || [],
            productWeight: request.body.productWeight || [],
            // New structure
            productType: request.body.productType || 'simple',
            status: request.body.status || 'draft',
            visibility: request.body.visibility || 'visible',
            // Images in new format
            images: imagesFormatted,
            // Pricing (new structure)
            pricing: pricingData,
            // Inventory (new structure)
            inventory: inventoryData,
            // Shipping (new structure)
            shipping: Object.keys(shippingData).length > 0 ? shippingData : undefined,
            // Tags
            tags: request.body.tags || [],
            // Attributes and Variations (for variable products)
            // Normalize attributes to ensure proper structure
            attributes: (request.body.attributes || []).map(attr => ({
                attributeId: attr.attributeId || null, // Optional
                name: attr.name,
                slug: attr.slug || attr.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                values: (attr.values || []).map(val => ({
                    valueId: val.valueId || null, // Optional
                    label: val.label || val,
                    slug: val.slug || (val.label || val).toLowerCase().replace(/[^a-z0-9]+/g, '-')
                })),
                visible: attr.visible !== false,
                variation: attr.variation !== false
            })),
            // Normalize variations to ensure proper structure
            variations: (request.body.variations || []).map(variation => ({
                ...variation,
                // Ensure required fields have defaults
                regularPrice: variation.regularPrice || variation.price || 0,
                price: variation.price || variation.regularPrice || variation.salePrice || 0,
                stock: variation.stock || 0,
                stockStatus: variation.stockStatus || (variation.stock > 0 ? 'in_stock' : 'out_of_stock'),
                manageStock: variation.manageStock !== false,
                isActive: variation.isActive !== false,
                isDefault: variation.isDefault || false,
                // Normalize variation attributes to ensure proper structure
                attributes: (variation.attributes || []).map(attr => ({
                    name: attr.name || attr,
                    slug: attr.slug || (attr.name || attr).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    value: attr.value || attr.label || attr,
                    valueSlug: attr.valueSlug || (attr.value || attr.label || attr).toLowerCase().replace(/[^a-z0-9]+/g, '-')
                }))
            })),
            // Legacy fields for backward compatibility
            price: pricingData.price,
            oldPrice: pricingData.regularPrice,
            countInStock: inventoryData.stock,
            rating: request.body.rating || 0,
            discount: request.body.discount || null,
            currency: pricingData.currency,
            // SEO
            seo: seoData,
            // SKU
            sku: request.body.sku || null,
            barcode: request.body.barcode || null
        };

        // Validate that we have at least one image
        if (imagesFormatted.length === 0) {
            return response.status(400).json({
                error: true,
                success: false,
                message: "At least one product image is required"
            });
        }

        let product = new ProductModel(productData);
        product = await product.save();

        console.log('Product created with images:', product.images?.length || 0, 'images');

        if (!product) {
            response.status(500).json({
                error: true,
                success: false,
                message: "Product Not created"
            });
        }


        imagesArr = [];

        return response.status(200).json({
            message: "Product Created successfully",
            error: false,
            success: true,
            product: product
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



//get all products
export async function getAllProducts(request, response) {
    try {

        const { page, limit } = request.query;
        const totalProducts = await ProductModel.find();

        const products = await ProductModel.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));

        const total = await ProductModel.countDocuments(products);

        if (!products) {
            return response.status(400).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
            total: total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalCount: totalProducts?.length,
            totalProducts: totalProducts
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


//get all products by category id
export async function getAllProductsByCatId(request, response) {
    try {

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10000;


        const totalPosts = await ProductModel.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages) {
            return response.status(404).json(
                {
                    message: "Page not found",
                    success: false,
                    error: true
                }
            );
        }

        const products = await ProductModel.find({
            catId: request.params.id
        }).populate("category")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
            totalPages: totalPages,
            page: page,
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


//get all products by category name
export async function getAllProductsByCatName(request, response) {
    try {

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10000;


        const totalPosts = await ProductModel.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages) {
            return response.status(404).json(
                {
                    message: "Page not found",
                    success: false,
                    error: true
                }
            );
        }


        const products = await ProductModel.find({
            catName: request.query.catName
        }).populate("category")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
            totalPages: totalPages,
            page: page,
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



//get all products by sub category id
export async function getAllProductsBySubCatId(request, response) {
    try {

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10000;


        const totalPosts = await ProductModel.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages) {
            return response.status(404).json(
                {
                    message: "Page not found",
                    success: false,
                    error: true
                }
            );
        }

        const products = await ProductModel.find({
            subCatId: request.params.id
        }).populate("category")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
            totalPages: totalPages,
            page: page,
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


//get all products by sub category name
export async function getAllProductsBySubCatName(request, response) {
    try {

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10000;


        const totalPosts = await ProductModel.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages) {
            return response.status(404).json(
                {
                    message: "Page not found",
                    success: false,
                    error: true
                }
            );
        }


        const products = await ProductModel.find({
            subCat: request.query.subCat
        }).populate("category")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
            totalPages: totalPages,
            page: page,
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}




//get all products by sub category id
export async function getAllProductsByThirdLavelCatId(request, response) {
    try {

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10000;


        const totalPosts = await ProductModel.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages) {
            return response.status(404).json(
                {
                    message: "Page not found",
                    success: false,
                    error: true
                }
            );
        }

        const products = await ProductModel.find({
            thirdsubCatId: request.params.id
        }).populate("category")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
            totalPages: totalPages,
            page: page,
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


//get all products by sub category name
export async function getAllProductsByThirdLavelCatName(request, response) {
    try {

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10000;


        const totalPosts = await ProductModel.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages) {
            return response.status(404).json(
                {
                    message: "Page not found",
                    success: false,
                    error: true
                }
            );
        }


        const products = await ProductModel.find({
            thirdsubCat: request.query.thirdsubCat
        }).populate("category")
            .skip((page - 1) * perPage)
            .limit(perPage)
            .exec();

        if (!products) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
            totalPages: totalPages,
            page: page,
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


//get all products by price

export async function getAllProductsByPrice(request, response) {
    let productList = [];

    if (request.query.catId !== "" && request.query.catId !== undefined) {
        const productListArr = await ProductModel.find({
            catId: request.query.catId,
        }).populate("category");

        productList = productListArr;
    }

    if (request.query.subCatId !== "" && request.query.subCatId !== undefined) {
        const productListArr = await ProductModel.find({
            subCatId: request.query.subCatId,
        }).populate("category");

        productList = productListArr;
    }


    if (request.query.thirdsubCatId !== "" && request.query.thirdsubCatId !== undefined) {
        const productListArr = await ProductModel.find({
            thirdsubCatId: request.query.thirdsubCatId,
        }).populate("category");

        productList = productListArr;
    }



    const filteredProducts = productList.filter((product) => {
        if (request.query.minPrice && product.price < parseInt(+request.query.minPrice)) {
            return false;
        }
        if (request.query.maxPrice && product.price > parseInt(+request.query.maxPrice)) {
            return false;
        }
        return true;
    });

    return response.status(200).json({
        error: false,
        success: true,
        products: filteredProducts,
        totalPages: 0,
        page: 0,
    });

}



//get all products by rating
export async function getAllProductsByRating(request, response) {
    try {

        const page = parseInt(request.query.page) || 1;
        const perPage = parseInt(request.query.perPage) || 10000;


        const totalPosts = await ProductModel.countDocuments();
        const totalPages = Math.ceil(totalPosts / perPage);

        if (page > totalPages) {
            return response.status(404).json(
                {
                    message: "Page not found",
                    success: false,
                    error: true
                }
            );
        }

        console.log(request.query.subCatId)

        let products = [];

        if (request.query.catId !== undefined) {

            products = await ProductModel.find({
                rating: request.query.rating,
                catId: request.query.catId,

            }).populate("category")
                .skip((page - 1) * perPage)
                .limit(perPage)
                .exec();
        }

        if (request.query.subCatId !== undefined) {

            products = await ProductModel.find({
                rating: request.query.rating,
                subCatId: request.query.subCatId,

            }).populate("category")
                .skip((page - 1) * perPage)
                .limit(perPage)
                .exec();
        }


        if (request.query.thirdsubCatId !== undefined) {

            products = await ProductModel.find({
                rating: request.query.rating,
                thirdsubCatId: request.query.thirdsubCatId,

            }).populate("category")
                .skip((page - 1) * perPage)
                .limit(perPage)
                .exec();
        }


        if (!products) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
            totalPages: totalPages,
            page: page,
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


//get all products count

export async function getProductsCount(request, response) {
    try {
        const productsCount = await ProductModel.countDocuments();

        if (!productsCount) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            productCount: productsCount
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



//get all features products
export async function getAllFeaturedProducts(request, response) {
    try {

        const products = await ProductModel.find({
            isFeatured: true
        }).populate("category");

        if (!products) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


//get all features products have banners
export async function getAllProductsBanners(request, response) {
    try {

        const products = await ProductModel.find({
            isDisplayOnHomeBanner: true
        }).populate("category");

        if (!products) {
            response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


//delete product
export async function deleteProduct(request, response) {

    const product = await ProductModel.findById(request.params.id).populate("category");

    if (!product) {
        return response.status(404).json({
            message: "Product Not found",
            error: true,
            success: false
        })
    }

    const images = product.images;

    let img = "";
    for (img of images) {
        const imgUrl = img;
        const urlArr = imgUrl.split("/");
        const image = urlArr[urlArr.length - 1];

        const imageName = image.split(".")[0];

        if (imageName) {
            cloudinary.uploader.destroy(imageName, (error, result) => {
                // console.log(error, result);
            });
        }


    }

    const deletedProduct = await ProductModel.findByIdAndDelete(request.params.id);

    if (!deletedProduct) {
        response.status(404).json({
            message: "Product not deleted!",
            success: false,
            error: true
        });
    }

    return response.status(200).json({
        success: true,
        error: false,
        message: "Product Deleted!",
    });
}


//delete multiple products
export async function deleteMultipleProduct(request, response) {
    const { ids } = request.body;

    if (!ids || !Array.isArray(ids)) {
        return response.status(400).json({ error: true, success: false, message: 'Invalid input' });
    }


    for (let i = 0; i < ids?.length; i++) {
        const product = await ProductModel.findById(ids[i]);

        const images = product.images;

        let img = "";
        for (img of images) {
            const imgUrl = img;
            const urlArr = imgUrl.split("/");
            const image = urlArr[urlArr.length - 1];

            const imageName = image.split(".")[0];

            if (imageName) {
                cloudinary.uploader.destroy(imageName, (error, result) => {
                    // console.log(error, result);
                });
            }


        }

    }

    try {
        await ProductModel.deleteMany({ _id: { $in: ids } });
        return response.status(200).json({
            message: "Product delete successfully",
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }

}

//get single product 
export async function getProduct(request, response) {
    try {
        // Fetch product with all fields including variations and attributes
        // Variations and attributes are embedded documents, so they're automatically included
        const product = await ProductModel.findById(request.params.id)
            .populate("category");

        if (!product) {
            return response.status(404).json({
                message: "The product is not found",
                error: true,
                success: false
            })
        }

        // Convert to plain object to ensure all fields are serialized
        const productObj = product.toObject ? product.toObject() : product;

        // Debug logging
        console.log('getProduct - Returning product:', {
            id: productObj._id,
            name: productObj.name,
            productType: productObj.productType,
            variationsCount: productObj.variations?.length || 0,
            attributesCount: productObj.attributes?.length || 0,
            hasVariations: !!productObj.variations && productObj.variations.length > 0
        });

        return response.status(200).json({
            error: false,
            success: true,
            product: productObj
        })

    } catch (error) {
        console.error('getProduct error:', error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

//delete images
export async function removeImageFromCloudinary(request, response) {

    const imgUrl = request.query.img;


    const urlArr = imgUrl.split("/");
    const image = urlArr[urlArr.length - 1];

    const imageName = image.split(".")[0];


    if (imageName) {
        const res = await cloudinary.uploader.destroy(
            imageName,
            (error, result) => {
                // console.log(error, res)
            }
        );

        if (res) {
            response.status(200).send(res);
        }
    }
}


//updated product 
export async function updateProduct(request, response) {
    try {
        // Handle images - transform to new format if needed
        let imagesFormatted = [];
        if (request.body.images && Array.isArray(request.body.images) && request.body.images.length > 0) {
            // Filter out any null/undefined/empty entries
            const validImages = request.body.images.filter(img => img != null && img !== '');
            
            imagesFormatted = validImages.map((img, index) => {
                // If already an object, use it
                if (typeof img === 'object' && img.url) {
                    return {
                        url: img.url,
                        alt: img.alt || '',
                        title: img.title || '',
                        position: img.position !== undefined ? img.position : index,
                        isFeatured: img.isFeatured !== undefined ? img.isFeatured : index === 0
                    };
                }
                // If string URL, convert to object
                return {
                    url: typeof img === 'string' ? img : '',
                    alt: '',
                    title: '',
                    position: index,
                    isFeatured: index === 0
                };
            }).filter(img => img.url && img.url !== ''); // Filter out any with empty URLs
        }

        // Build update data
        const updateData = {
            name: request.body.name,
            subCat: request.body.subCat,
            description: request.body.description,
            bannerimages: request.body.bannerimages || [],
            bannerTitleName: request.body.bannerTitleName || '',
            isDisplayOnHomeBanner: request.body.isDisplayOnHomeBanner || false,
            images: imagesFormatted.length > 0 ? imagesFormatted : undefined,
            brand: request.body.brand,
            price: request.body.price,
            oldPrice: request.body.oldPrice,
            catId: request.body.catId,
            catName: request.body.catName,
            subCatId: request.body.subCatId,
            category: request.body.category,
            thirdsubCat: request.body.thirdsubCat,
            thirdsubCatId: request.body.thirdsubCatId,
            countInStock: request.body.countInStock,
            rating: request.body.rating,
            isFeatured: request.body.isFeatured,
            productRam: request.body.productRam || [],
            size: request.body.size || [],
            productWeight: request.body.productWeight || [],
        };

        // Remove undefined fields
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        // Update pricing if price fields are provided
        if (request.body.price !== undefined || request.body.oldPrice !== undefined) {
            updateData.pricing = {
                regularPrice: request.body.oldPrice || request.body.price || 0,
                salePrice: request.body.oldPrice && request.body.price < request.body.oldPrice ? request.body.price : null,
                price: request.body.price || request.body.oldPrice || 0,
                currency: request.body.currency || 'USD',
                onSale: request.body.oldPrice && request.body.price < request.body.oldPrice
            };
        }

        // Update inventory if stock is provided
        if (request.body.countInStock !== undefined) {
            updateData.inventory = {
                stock: request.body.countInStock || 0,
                stockStatus: (request.body.countInStock || 0) > 0 ? 'in_stock' : 'out_of_stock',
                manageStock: true
            };
        }

        const product = await ProductModel.findByIdAndUpdate(
            request.params.id,
            updateData,
            { new: true }
        );


        if (!product) {
            return response.status(404).json({
                message: "the product can not be updated!",
                status: false,
            });
        }

        imagesArr = [];

        return response.status(200).json({
            message: "The product is updated",
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}




export async function createProductRAMS(request, response) {
    try {
        let productRAMS = new ProductRAMSModel({
            name: request.body.name
        })

        productRAMS = await productRAMS.save();

        if (!productRAMS) {
            response.status(500).json({
                error: true,
                success: false,
                message: "Product RAMS Not created"
            });
        }

        return response.status(200).json({
            message: "Product RAMS Created successfully",
            error: false,
            success: true,
            product: productRAMS
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export async function deleteProductRAMS(request, response) {
    const productRams = await ProductRAMSModel.findById(request.params.id);

    if (!productRams) {
        return response.status(404).json({
            message: "Item Not found",
            error: true,
            success: false
        })
    }

    const deletedProductRams = await ProductRAMSModel.findByIdAndDelete(request.params.id);

    if (!deletedProductRams) {
        response.status(404).json({
            message: "Item not deleted!",
            success: false,
            error: true
        });
    }

    return response.status(200).json({
        success: true,
        error: false,
        message: "Product Ram Deleted!",
    });
}

export async function updateProductRam(request, response) {

    try {

        const productRam = await ProductRAMSModel.findByIdAndUpdate(
            request.params.id,
            {
                name: request.body.name,
            },
            { new: true }
        );


        if (!productRam) {
            return response.status(404).json({
                message: "the product Ram can not be updated!",
                status: false,
            });
        }

        return response.status(200).json({
            message: "The product Ram is updated",
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }

}


export async function getProductRams(request, response) {

    try {

        const productRam = await ProductRAMSModel.find();

        if (!productRam) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            data: productRam
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function getProductRamsById(request, response) {

    try {

        const productRam = await ProductRAMSModel.findById(request.params.id);

        if (!productRam) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            data: productRam
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export async function createProductWEIGHT(request, response) {
    try {
        let productWeight = new ProductWEIGHTModel({
            name: request.body.name
        })

        productWeight = await productWeight.save();

        if (!productWeight) {
            response.status(500).json({
                error: true,
                success: false,
                message: "Product WEIGHT Not created"
            });
        }

        return response.status(200).json({
            message: "Product WEIGHT Created successfully",
            error: false,
            success: true,
            product: productWeight
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export async function deleteProductWEIGHT(request, response) {
    const productWeight = await ProductWEIGHTModel.findById(request.params.id);

    if (!productWeight) {
        return response.status(404).json({
            message: "Item Not found",
            error: true,
            success: false
        })
    }

    const deletedProductWeight = await ProductWEIGHTModel.findByIdAndDelete(request.params.id);

    if (!deletedProductWeight) {
        response.status(404).json({
            message: "Item not deleted!",
            success: false,
            error: true
        });
    }

    return response.status(200).json({
        success: true,
        error: false,
        message: "Product Weight Deleted!",
    });
}


export async function updateProductWeight(request, response) {

    try {

        const productWeight = await ProductWEIGHTModel.findByIdAndUpdate(
            request.params.id,
            {
                name: request.body.name,
            },
            { new: true }
        );


        if (!productWeight) {
            return response.status(404).json({
                message: "the product weight can not be updated!",
                status: false,
            });
        }

        return response.status(200).json({
            message: "The product weight is updated",
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }

}


export async function getProductWeight(request, response) {

    try {

        const productWeight = await ProductWEIGHTModel.find();

        if (!productWeight) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            data: productWeight
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function getProductWeightById(request, response) {

    try {

        const productWeight = await ProductWEIGHTModel.findById(request.params.id);

        if (!productWeight) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            data: productWeight
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export async function createProductSize(request, response) {
    try {
        let productSize = new ProductSIZEModel({
            name: request.body.name
        })

        productSize = await productSize.save();

        if (!productSize) {
            response.status(500).json({
                error: true,
                success: false,
                message: "Product size Not created"
            });
        }

        return response.status(200).json({
            message: "Product size Created successfully",
            error: false,
            success: true,
            product: productSize
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export async function deleteProductSize(request, response) {
    const productSize = await ProductSIZEModel.findById(request.params.id);

    if (!productSize) {
        return response.status(404).json({
            message: "Item Not found",
            error: true,
            success: false
        })
    }

    const deletedProductSize = await ProductSIZEModel.findByIdAndDelete(request.params.id);

    if (!deletedProductSize) {
        response.status(404).json({
            message: "Item not deleted!",
            success: false,
            error: true
        });
    }

    return response.status(200).json({
        success: true,
        error: false,
        message: "Product size Deleted!",
    });
}


export async function updateProductSize(request, response) {

    try {

        const productSize = await ProductSIZEModel.findByIdAndUpdate(
            request.params.id,
            {
                name: request.body.name,
            },
            { new: true }
        );


        if (!productSize) {
            return response.status(404).json({
                message: "the product size can not be updated!",
                status: false,
            });
        }

        return response.status(200).json({
            message: "The product size is updated",
            error: false,
            success: true
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }

}


export async function getProductSize(request, response) {

    try {

        const productSize = await ProductSIZEModel.find();

        if (!productSize) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            data: productSize
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export async function getProductSizeById(request, response) {

    try {

        const productSize = await ProductSIZEModel.findById(request.params.id);

        if (!productSize) {
            return response.status(500).json({
                error: true,
                success: false
            })
        }

        return response.status(200).json({
            error: false,
            success: true,
            data: productSize
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export async function filters(request, response) {
    const { catId, subCatId, thirdsubCatId, minPrice, maxPrice, rating, page, limit } = request.body;

    const filters = {}

    if (catId?.length) {
        filters.catId = { $in: catId }
    }

    if (subCatId?.length) {
        filters.subCatId = { $in: subCatId }
    }

    if (thirdsubCatId?.length) {
        filters.thirdsubCatId = { $in: thirdsubCatId }
    }

    if (minPrice || maxPrice) {
        filters.price = { $gte: +minPrice || 0, $lte: +maxPrice || Infinity };
    }

    if (rating?.length) {
        filters.rating = { $in: rating }
    }

    try {

        const products = await ProductModel.find(filters).populate("category").skip((page - 1) * limit).limit(parseInt(limit));

        const total = await ProductModel.countDocuments(filters);

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
            total: total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }


}


// Sort function
const sortItems = (products, sortBy, order) => {
    return products.sort((a, b) => {
        if (sortBy === 'name') {
            return order === 'asc'
                ? a.name.localeCompare(b.name)
                : b.name.localeCompare(a.name);
        }
        if (sortBy === 'price') {
            return order === 'asc' ? a.price - b.price : b.price - a.price;
        }
        return 0; // Default
    });
};


export async function sortBy(request, response) {
    const { products, sortBy, order } = request.body;
    const sortedItems = sortItems([...products?.products], sortBy, order);
    return response.status(200).json({
        error: false,
        success: true,
        products: sortedItems,
        totalPages: 0,
        page: 0,
    });
}




export async function searchProductController(request, response) {
    try {

        const {query, page, limit } = request.body;

        if (!query) {
            return response.status(400).json({
                error: true,
                success: false,
                message: "Query is required"
            });
        }


        const products = await ProductModel.find({
            $or: [
                { name: { $regex: query, $options: "i" } },
                { brand: { $regex: query, $options: "i" } },
                { catName: { $regex: query, $options: "i" } },
                { subCat: { $regex: query, $options: "i" } },
                { thirdsubCat: { $regex: query, $options: "i" } },
            ],
        }).populate("category")

        const total = await products?.length

        return response.status(200).json({
            error: false,
            success: true,
            products: products,
            total: 1,
            page: parseInt(page),
            totalPages: 1
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}