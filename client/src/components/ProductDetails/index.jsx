import React, { useContext, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { QtyBox } from "../QtyBox";
import Rating from "@mui/material/Rating";
import { MdOutlineShoppingCart } from "react-icons/md";
import { FaRegHeart } from "react-icons/fa";
import { MyContext } from "../../App";
import CircularProgress from '@mui/material/CircularProgress';
import { postData } from "../../utils/api";
import { FaCheckDouble } from "react-icons/fa";
import { IoMdHeart } from "react-icons/io";
import { formatCurrency } from "../../utils/currency";
import { normalizeProduct } from "../../utils/productNormalizer";
import ProductVariations from "../ProductVariations";



export const ProductDetailsComponent = (props) => {
  // Normalize product data to ensure consistent structure
  const product = normalizeProduct(props?.item);
  
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isAddedInMyList, setIsAddedInMyList] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState(null);

  // Handle variation change from ProductVariations component
  const handleVariationChange = (variation) => {
    setSelectedVariation(variation);
    // Also notify parent if callback provided
    if (props.onVariationChange) {
      props.onVariationChange(variation);
    }
  };

  const context = useContext(MyContext);

  const handleSelecteQty = (qty) => {
    setQuantity(qty);
  }


  useEffect(() => {
    const cartItem = context?.cartData?.filter((cartItem) =>
      cartItem.productId.includes(product?._id)
    )

    if (cartItem?.length !== 0) {
      setIsAdded(true)
    } else {
      setIsAdded(false)
    }

  }, [isAdded, product?._id, context?.cartData])


  useEffect(() => {
    const myListItem = context?.myListData?.filter((listItem) =>
      listItem.productId.includes(product?._id)
    )


    if (myListItem?.length !== 0) {
      setIsAddedInMyList(true);
    } else {
      setIsAddedInMyList(false)
    }

  }, [context?.myListData, product?._id])

  const addToCart = (product, userId, quantity) => {


    if (userId === undefined) {
      context?.alertBox("error", "You are not logged in. Please login first.");
      return false;
    }

    // For variable products, require variation selection
    // Simplified check - only look at productType
    const isVariableProduct = product?.productType === 'variable' || product?.type === 'variable';
    
    if (isVariableProduct && !selectedVariation) {
      // Development mode logging
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Add to Cart blocked: Variable product requires variation selection');
        console.log('Product:', product?.name);
        console.log('ProductType:', product?.productType);
        console.log('Selected Variation:', selectedVariation);
      }
      
      context?.alertBox(
        "error", 
        "Please select all product options (size, color, etc.) before adding to cart"
      );
      return false;
    }

    // Log successful add to cart in dev mode
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Adding to cart:', {
        product: product?.name,
        isVariable: isVariableProduct,
        variation: selectedVariation,
        quantity: quantity
      });
    }

    // Determine price: use selected variation price if available, otherwise use product price
    const displayPrice = selectedVariation 
      ? (selectedVariation.salePrice || selectedVariation.regularPrice || selectedVariation.price)
      : (product?.salePrice || product?.oldPrice || product?.price);

    // Determine stock: use selected variation stock if available
    const stock = selectedVariation 
      ? selectedVariation.stock 
      : (product?.countInStock || product?.stock);

    // Check stock availability
    if (stock <= 0) {
      context?.alertBox("error", "This product is out of stock");
      return false;
    }
    
    if (stock < quantity) {
      context?.alertBox("error", `Only ${stock} items available in stock`);
      return false;
    }

    // Normalize image URL (handle both string and object formats)
    const getImageUrl = (img) => {
      if (!img) return '';
      if (typeof img === 'string') return img;
      if (typeof img === 'object' && img.url) return img.url;
      if (typeof img === 'object' && img.secureUrl) return img.secureUrl;
      return '';
    };

    const productItem = {
      _id: selectedVariation?._id || product?._id,
      productId: product?._id,
      variationId: selectedVariation?._id || null,
      productTitle: product?.name || '',
      image: getImageUrl(selectedVariation?.image) || getImageUrl(product?.images?.[0]) || getImageUrl(product?.featuredImage) || '',
      rating: product?.rating || 0,
      price: parseFloat(displayPrice) || 0,
      oldPrice: product?.oldPrice ? parseFloat(product.oldPrice) : null,
      discount: product?.discount || 0,
      quantity: parseInt(quantity) || 1,
      subTotal: parseFloat(displayPrice * quantity) || 0,
      countInStock: parseInt(stock) || 0,
      brand: product?.brand || '',
      productType: product?.productType || (product?.variations && product.variations.length > 0 ? 'variable' : 'simple'),
      variation: selectedVariation ? {
        attributes: selectedVariation.attributes || [],
        sku: selectedVariation.sku || '',
        image: getImageUrl(selectedVariation.image) || ''
      } : null
    }

    setIsLoading(true);
    postData("/api/cart/add", productItem).then((res) => {
      if (res?.error === false) {
        context?.alertBox("success", res?.message);
        context?.getCartItems();
        setTimeout(() => {
          setIsLoading(false);
          setIsAdded(true)
        }, 500);
      } else {
        context?.alertBox("error", res?.message);
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    })
  }


  const handleAddToMyList = (item) => {
    if (context?.userData === null) {
      context?.alertBox("error", "you are not login please login first");
      return false
    }

    else {
      // Determine price: use salePrice if available, fallback to oldPrice, then price
      const displayPrice = product?.salePrice || product?.oldPrice || product?.price;

      const obj = {
        productId: product?._id,
        userId: context?.userData?._id,
        productTitle: product?.name,
        image: product?.images?.[0] || product?.featuredImage || '',
        rating: product?.rating,
        price: displayPrice,
        brand: product?.brand,
      }

      postData("/api/myList/add", obj).then((res) => {
        if (res?.error === false) {
          context?.alertBox("success", res?.message);
          setIsAddedInMyList(true);
          context?.getMyListData();
        } else {
          context?.alertBox("error", res?.message);
        }
      })

    }
  }


  return (
    <div className="product-details-wrapper">
      {/* Product Title */}
      <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-[700] mb-3 text-gray-900">
        {product?.name}
      </h1>

      {/* Brand and Rating */}
      <div className="flex items-center flex-wrap gap-4 mb-4">
        {product?.brand && (
          <span className="text-gray-600 text-[14px]">
            <span className="font-[500] text-gray-800">Brand:</span> {product?.brand}
          </span>
        )}
        <div className="flex items-center gap-2">
          <Rating name="size-small" value={product?.rating || 0} size="small" readOnly />
          <span className="text-[13px] text-gray-600 cursor-pointer hover:text-primary transition" onClick={props.gotoReviews}>
            ({props.reviewsCount || 0} Reviews)
          </span>
        </div>
      </div>

      {/* Pricing */}
      <div className="mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          {(() => {
            // Use variation price if selected, otherwise use product price
            let salePrice, regularPrice;
            
            if (selectedVariation) {
              salePrice = selectedVariation.salePrice;
              regularPrice = selectedVariation.regularPrice || selectedVariation.price;
            } else {
              salePrice = product?.salePrice;
              regularPrice = product?.oldPrice || product?.price;
            }
            
            if (salePrice && salePrice < regularPrice) {
              // Product is on sale - show regular price crossed out, sale price as current
              return (
                <>
                  <span className="oldPrice line-through text-gray-400 text-[22px] font-[500]">
                    {formatCurrency(regularPrice)}
                  </span>
                  <span className="price text-primary text-[28px] font-[700]">
                    {formatCurrency(salePrice)}
                  </span>
                </>
              );
            } else {
              // No sale - show regular price only
              return (
                <span className="price text-primary text-[28px] font-[700]">
                  {formatCurrency(regularPrice)}
                </span>
              );
            }
          })()}
        </div>
      </div>

      {/* Product Description */}
      {product?.description && (
        <div className="mb-6">
          <p className="text-[14px] text-gray-700 leading-relaxed pr-4">
            {product?.description}
          </p>
        </div>
      )}

      {/* Product Variations */}
      {(() => {
        // Debug: Log product data
        if (product) {
          console.log('ProductDetails - Product data check:', {
            productType: product.productType,
            hasVariations: !!product.variations,
            variationsCount: product.variations?.length || 0,
            hasAttributes: !!product.attributes,
            attributesCount: product.attributes?.length || 0,
            fullProduct: product
          });
        }

        // Show variations if product is variable OR has variations/attributes
        const shouldShowVariations = product?.productType === 'variable' || 
                                    (product?.variations && product.variations.length > 0) ||
                                    (product?.attributes && product.attributes.length > 0);

        if (shouldShowVariations) {
          return (
            <ProductVariations 
              product={product} 
              onVariationSelect={handleVariationChange}
              selectedVariation={selectedVariation}
            />
          );
        }
        
        return null;
      })()}

      {/* Stock display - update based on selected variation */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[14px] font-[600] text-gray-700">
            Availability:
          </span>
          <span className={`text-[14px] font-bold ${
            (selectedVariation ? selectedVariation.stock : (product?.countInStock || product?.stock)) > 0 
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {selectedVariation 
              ? `${selectedVariation.stock} Items Available` 
              : `${product?.countInStock || product?.stock} Items Available`}
          </span>
        </div>
        <p className="text-[13px] text-gray-600 mt-2">
          📦 Shipping rates calculated at checkout based on your address
        </p>
      </div>

      {/* Quantity and Add to Cart */}
      <div className="mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="qtyBoxWrapper">
            <label className="block text-[13px] font-[600] text-gray-700 mb-2">Quantity:</label>
            <QtyBox handleSelecteQty={handleSelecteQty} />
          </div>
        </div>
        
        <div className="mt-4">
          <Button 
            className="btn-org flex gap-2 !min-w-[200px] !py-3 !text-[16px] !font-[600]" 
            onClick={() => addToCart(product, context?.userData?._id, quantity)}
            disabled={isLoading}
            fullWidth
            sx={{
              backgroundColor: '#efb291',
              color: '#0b2735',
              '&:hover': {
                backgroundColor: '#e5a080',
              },
              '&.Mui-disabled': {
                backgroundColor: '#d1d5db',
                color: '#9ca3af'
              }
            }}
          >
            {
              isLoading === true ? (
                <CircularProgress size={20} sx={{ color: '#0b2735' }} />
              ) : (
                <>
                  {
                    isAdded === true ? (
                      <>
                        <FaCheckDouble className="text-[20px]" /> Added to Cart
                      </>
                    ) : (
                      <>
                        <MdOutlineShoppingCart className="text-[22px]" /> Add to Cart
                      </>
                    )
                  }
                </>
              )
            }
          </Button>
        </div>
      </div>

      {/* Wishlist and Compare */}
      <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
        <span 
          className="flex items-center gap-2 text-[14px] text-gray-700 cursor-pointer font-[500] hover:text-primary transition-colors" 
          onClick={() => handleAddToMyList(product)}
        >
          {
            isAddedInMyList === true ? (
              <IoMdHeart className="text-[20px] text-primary" />
            ) : (
              <FaRegHeart className="text-[20px]" />
            )
          }
          Add to Wishlist
        </span>

      </div>
    </div>
  );
};
