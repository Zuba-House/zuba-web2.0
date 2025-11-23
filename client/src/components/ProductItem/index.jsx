import React, { useContext, useEffect, useState } from "react";
import "../ProductItem/style.css";
import { Link, useNavigate } from "react-router-dom";
import Rating from "@mui/material/Rating";
import Button from "@mui/material/Button";
import { FaRegHeart } from "react-icons/fa";
import { MdZoomOutMap } from "react-icons/md";
import { MyContext } from "../../App";
import { MdOutlineShoppingCart } from "react-icons/md";
import { FaMinus } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa6";
import { deleteData, editData, postData } from "../../utils/api";
import CircularProgress from '@mui/material/CircularProgress';
import { MdClose } from "react-icons/md";
import { IoMdHeart } from "react-icons/io";
import { formatCurrency } from "../../utils/currency";
import { normalizeProduct } from "../../utils/productNormalizer";
import { getPriceRange, isVariableProduct } from '../../utils/productUtils';



const ProductItem = (props) => {
  // Normalize product data for backward compatibility
  const item = normalizeProduct(props?.item);
  const navigate = useNavigate();

  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isAddedInMyList, setIsAddedInMyList] = useState(false);
  const [cartItem, setCartItem] = useState([]);

  const [activeTab, setActiveTab] = useState(null);
  const [isShowTabs, setIsShowTabs] = useState(false);
  const [selectedTabName, setSelectedTabName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);


  const context = useContext(MyContext);

  const addToCart = (product, userId, quantity) => {
    // For guest users, show info message and redirect to login
    if (userId === undefined) {
      context?.alertBox(
        "info", 
        "Please login to add items to cart. Registration is quick and easy!"
      );
      // Redirect to login page
      navigate("/login");
      return false;
    }

    const normalizedProduct = normalizeProduct(product);
    
    // For variable products, redirect to product detail page to select variations
    const isVariable = isVariableProduct(normalizedProduct);
    
    if (isVariable) {
      // Development mode logging
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Variable product detected - redirecting to product page');
        console.log('Product:', normalizedProduct?.name);
        console.log('ProductType:', normalizedProduct?.productType);
      }
      
      context?.alertBox(
        "info", 
        "Please visit the product page to select your options (size, color, etc.) before adding to cart"
      );
      
      // Redirect to product detail page using React Router
      navigate(`/product/${normalizedProduct?._id}`);
      return false;
    }

    // For simple products, proceed with adding to cart
    const firstImage = normalizedProduct.images && normalizedProduct.images.length > 0 
      ? (typeof normalizedProduct.images[0] === 'string' ? normalizedProduct.images[0] : normalizedProduct.images[0].url)
      : normalizedProduct.featuredImage || '';

    const productItem = {
      _id: normalizedProduct?._id,
      name: normalizedProduct?.name,
      image: firstImage,
      rating: normalizedProduct?.rating,
      price: normalizedProduct?.price,
      oldPrice: normalizedProduct?.oldPrice,
      discount: normalizedProduct?.discount,
      quantity: quantity,
      subTotal: parseInt(normalizedProduct?.price * quantity),
      productId: normalizedProduct?._id,
      countInStock: normalizedProduct?.countInStock || normalizedProduct?.stock,
      brand: normalizedProduct?.brand,
      size: item?.size?.length !== 0 ? selectedTabName : '',
      weight: item?.productWeight?.length !== 0 ? selectedTabName : '',
      ram: item?.productRam?.length !== 0 ? selectedTabName : ''

    }

    setIsLoading(true);

    // Handle old-style variations (size, RAM, weight) - legacy support
    if (item?.size?.length !== 0 || item?.productRam?.length !== 0 || item?.productWeight
      ?.length !== 0) {
      setIsShowTabs(true)
    } else {
      setIsAdded(true);

      setIsShowTabs(false);
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
      context?.addToCart(productItem, userId, quantity);

    }

    // Handle old-style tab selection - legacy support
    if (activeTab !== null) {
      context?.addToCart(productItem, userId, quantity);
      setIsAdded(true);
      setIsShowTabs(false)
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  }


  const handleClickActiveTab = (index, name) => {
    setActiveTab(index)
    setSelectedTabName(name)
  }

  useEffect(() => {
    const cartItem = context?.cartData?.filter((cartItem) =>
      cartItem.productId.includes(item?._id)
    )

    const myListItem = context?.myListData?.filter((listItem) =>
      listItem.productId.includes(item?._id)
    )

    if (cartItem?.length !== 0) {
      setCartItem(cartItem)
      setIsAdded(true);
      setQuantity(cartItem[0]?.quantity)
    } else {
      setQuantity(1)
    }


    if (myListItem?.length !== 0) {
      setIsAddedInMyList(true);
    } else {
      setIsAddedInMyList(false)
    }

  }, [context?.cartData]);


  const minusQty = () => {
    if (quantity !== 1 && quantity > 1) {
      setQuantity(quantity - 1)
    } else {
      setQuantity(1)
    }


    if (quantity === 1) {
      deleteData(`/api/cart/delete-cart-item/${cartItem[0]?._id}`).then((res) => {
        setIsAdded(false);
        context.alertBox("success", "Item Removed ");
        context?.getCartItems();
        setIsShowTabs(false);
        setActiveTab(null);
      })
    } else {
      const obj = {
        _id: cartItem[0]?._id,
        qty: quantity - 1,
        subTotal: item?.price * (quantity - 1)
      }

      editData(`/api/cart/update-qty`, obj).then((res) => {
        context.alertBox("success", res?.data?.message);
        context?.getCartItems();
      })
    }

  }


  const addQty = () => {

    setQuantity(quantity + 1);

    const obj = {
      _id: cartItem[0]?._id,
      qty: quantity + 1,
      subTotal: item?.price * (quantity + 1)
    }

    editData(`/api/cart/update-qty`, obj).then((res) => {
      context.alertBox("success", res?.data?.message);
      context?.getCartItems();
    })



  }


  const handleAddToMyList = (item) => {
    if (context?.userData === null) {
      context?.alertBox("error", "you are not login please login first");
      return false
    }

    else {
      const obj = {
        productId: item?._id,
        userId: context?.userData?._id,
        productTitle: item?.name,
        image: item?.images[0],
        rating: item?.rating,
        price: item?.price,
        oldPrice: item?.oldPrice,
        brand: item?.brand,
        discount: item?.discount
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


  // Helper functions for stock status
  const getProductStock = () => {
    // Check for endless stock first
    if (item?.inventory?.endlessStock) return null; // null indicates endless/unlimited
    
    // For variable products, get total stock from all active variations
    if (item?.productType === 'variable' || item?.type === 'variable') {
      if (Array.isArray(item?.variations) && item.variations.length > 0) {
        // Check if any variation has endless stock
        const hasEndlessStock = item.variations.some(v => v && v.endlessStock && (v.isActive !== false));
        if (hasEndlessStock) return null; // null indicates endless/unlimited
        
        // Return total stock across all ACTIVE variations
        return item.variations
          .filter(v => v && (v.isActive !== false))
          .reduce((total, v) => {
            return total + Number(v.stock || 0);
          }, 0);
      }
    }
    // For simple products
    return item?.countInStock || item?.stock || item?.inventory?.stock || 0;
  };

  const isOutOfStock = () => {
    // Check for endless stock first
    if (item?.inventory?.endlessStock) return false; // Endless stock is always in stock
    
    // For variable products, check if ANY variation is in stock
    if (item?.productType === 'variable' || item?.type === 'variable') {
      if (item?.variations && Array.isArray(item.variations) && item.variations.length > 0) {
        // Product is out of stock only if ALL variations are out of stock
        const hasInStockVariation = item.variations.some(v => {
          if (!v || v.isActive === false) return false;
          // Endless stock is always in stock
          if (v.endlessStock) return true;
          const stock = Number(v.stock || 0);
          const stockStatus = v.stockStatus || (stock > 0 ? 'in_stock' : 'out_of_stock');
          return stockStatus === 'in_stock' && stock > 0;
        });
        return !hasInStockVariation; // Out of stock if NO variations are in stock
      }
      // If no variations, consider it out of stock
      return true;
    }
    // For simple products, check total stock (null means endless/unlimited)
    const stock = getProductStock();
    return stock !== null && stock <= 0;
  };

  const isLowStock = () => {
    const stock = getProductStock();
    return stock > 0 && stock <= 5;
  };

  return (
    <div className="productItem shadow-lg rounded-md overflow-hidden border-1 border-[rgba(0,0,0,0.1)]">
      <div className="group imgWrapper w-[100%]  overflow-hidden  rounded-md rounded-bl-none rounded-br-none relative">
        {/* Out of Stock Badge */}
        {isOutOfStock() && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-[8px] lg:text-[10px] font-bold z-20">
            OUT OF STOCK
          </div>
        )}
        {isLowStock() && !isOutOfStock() && getProductStock() !== null && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-black px-2 py-1 rounded text-[8px] lg:text-[10px] font-bold z-20">
            Only {getProductStock()} left
          </div>
        )}

        <Link to={`/product/${item?._id}`}>
          <div className="img product-image-container">
            <img
              src={(() => {
                // Helper to extract URL from image (string or object)
                const getImageUrl = (img) => {
                  if (!img) return null;
                  if (typeof img === 'string' && img.trim() !== '') return img.trim();
                  if (typeof img === 'object') {
                    if (img.url && typeof img.url === 'string' && img.url.trim() !== '') return img.url.trim();
                    if (img.src && typeof img.src === 'string' && img.src.trim() !== '') return img.src.trim();
                  }
                  return null;
                };
                
                // Try featuredImage first
                const featuredUrl = getImageUrl(item?.featuredImage);
                if (featuredUrl) return featuredUrl;
                
                // Try images array - check all images
                if (item?.images && Array.isArray(item.images) && item.images.length > 0) {
                  for (let i = 0; i < item.images.length; i++) {
                    const imgUrl = getImageUrl(item.images[i]);
                    if (imgUrl) return imgUrl;
                  }
                }
                
                // Try bannerimages as fallback
                if (item?.bannerimages && Array.isArray(item.bannerimages) && item.bannerimages.length > 0) {
                  for (let i = 0; i < item.bannerimages.length; i++) {
                    const imgUrl = getImageUrl(item.bannerimages[i]);
                    if (imgUrl) return imgUrl;
                  }
                }
                
                // Try image field (singular)
                const singleImageUrl = getImageUrl(item?.image);
                if (singleImageUrl) return singleImageUrl;
                
                // Last resort: placeholder
                return 'https://via.placeholder.com/400x400?text=No+Image';
              })()}
              className="product-image"
              alt={item?.name || 'Product image'}
              loading="lazy"
              onError={(e) => {
                // Prevent infinite loop
                if (e.target.src && !e.target.src.includes('placeholder')) {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
                }
              }}
            />

            {
              item?.images?.length > 1 && (() => {
                const secondImage = item.images[1];
                const secondImageUrl = typeof secondImage === 'string' 
                  ? (secondImage.trim() !== '' ? secondImage : null)
                  : (secondImage?.url && secondImage.url.trim() !== '' ? secondImage.url : null);
                
                return secondImageUrl ? (
                  <img
                    src={secondImageUrl}
                    className="w-full transition-all duration-700 absolute top-0 left-0 opacity-0 group-hover:opacity-100 group-hover:scale-105"
                    alt={item?.name || 'Product image'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : null;
              })()
            }


          </div>
        </Link>



        {
          isShowTabs === true &&
          <div className="flex items-center justify-center absolute top-0 left-0 w-full h-full 
      bg-[rgba(0,0,0,0.7)] z-[60] p-3 gap-2">

            <Button className="!absolute top-[10px] right-[10px] !min-w-[30px] !min-h-[30px] !w-[30px] !h-[30px] !rounded-full !bg-[rgba(255,255,255,1)] text-black"
              onClick={() => setIsShowTabs(false)}
            > <MdClose className=" text-black z-[90] text-[25px]" /></Button>

            {
              item?.size?.length !== 0 && item?.size?.map((sizeItem, index) => {
                return (
                  <span key={index} className={`flex items-center justify-center p-1 px-2 bg-[rgba(255,555,255,0.8)] max-w-[35px] h-[25px]  
          rounded-sm cursor-pointer hover:bg-white 
          ${activeTab === index && '!bg-primary text-white'}`}
                    onClick={() => handleClickActiveTab(index, sizeItem)}
                  >{sizeItem}
                  </span>)
              })
            }

            {
              item?.productRam?.length !== 0 && item?.productRam?.map((ramItem, index) => {
                return (
                  <span key={index} className={`flex items-center justify-center p-1 px-2 bg-[rgba(255,555,255,0.8)] max-w-[45px] h-[25px]  
          rounded-sm cursor-pointer hover:bg-white 
          ${activeTab === index && '!bg-primary text-white'}`}
                    onClick={() => handleClickActiveTab(index, ramItem)}
                  >{ramItem}
                  </span>)
              })
            }


            {
              item?.productWeight?.length !== 0 && item?.productWeight?.map((weightItem, index) => {
                return (
                  <span key={index} className={`flex items-center justify-center p-1 px-2 bg-[rgba(255,555,255,0.8)] max-w-[35px] h-[25px]  
          rounded-sm cursor-pointer hover:bg-white 
          ${activeTab === index && '!bg-primary text-white'}`}
                    onClick={() => handleClickActiveTab(index, weightItem)}
                  >{weightItem}
                  </span>)
              })
            }

          </div>
        }


        {item?.isOnSale && item?.discount && (
          <span className="discount flex items-center absolute top-[10px] left-[10px] z-50 bg-primary text-white rounded-lg p-1 text-[12px] font-[500]">
            {item?.discount}%
          </span>
        )}

        <div className="actions absolute top-[-20px] right-[5px] z-50 flex items-center gap-2 flex-col w-[50px] transition-all duration-300 group-hover:top-[15px] opacity-0 group-hover:opacity-100">

          <Button 
            className="!w-[44px] !h-[44px] lg:!w-[42px] lg:!h-[42px] !min-w-[44px] lg:!min-w-[42px] !rounded-full !bg-white shadow-lg text-black hover:!bg-primary hover:text-white group transition-all duration-200 hover:scale-110" 
            onClick={() => context.handleOpenProductDetailsModal(true, item)}
            title="Quick View"
            aria-label="Quick View Product"
          >
            <MdZoomOutMap className="text-[20px] lg:text-[18px] !text-black group-hover:text-white hover:!text-white" />
          </Button>


          <Button 
            className={`!w-[44px] !h-[44px] lg:!w-[42px] lg:!h-[42px] !min-w-[44px] lg:!min-w-[42px] !rounded-full !bg-white shadow-lg text-black hover:!bg-primary hover:text-white group transition-all duration-200 hover:scale-110`}
            onClick={() => handleAddToMyList(item)}
            title={isAddedInMyList ? "Remove from Wishlist" : "Add to Wishlist"}
            aria-label={isAddedInMyList ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            {
              isAddedInMyList === true ? <IoMdHeart className="text-[20px] lg:text-[18px] !text-primary group-hover:text-white hover:!text-white" /> :
                <FaRegHeart className="text-[20px] lg:text-[18px] !text-black group-hover:text-white hover:!text-white" />
            }
          </Button>
        </div>
      </div>

      <div className="info p-3 py-5 relative pb-[50px] lg:h-[190px] h-auto">
        <h6 className="text-[10px] lg:text-[13px] !font-[400]">
          <span className="link transition-all">
            {item?.brand}
          </span>
        </h6>
        <h3 className="text-[11px] lg:text-[13px] title mt-1 font-[500] mb-1 text-[#000]">
          <Link to={`/product/${item?._id}`} className="link transition-all">
            {item?.name?.substring(0, 25) + (item?.name?.length > 25 ? '...' : '')}
          </Link>
        </h3>

        <Rating name="size-small" defaultValue={item?.rating} size="small" readOnly />

        <div className="flex items-center gap-2 justify-between flex-wrap">
          {isVariableProduct(item) ? (
            // Variable product - show price range
            (() => {
              const priceRange = getPriceRange(item);
              if (priceRange && priceRange.min !== priceRange.max) {
                return (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="price text-primary text-[12px] lg:text-[14px] font-[600]">
                      {formatCurrency(priceRange.min)} - {formatCurrency(priceRange.max)}
                    </span>
                    <span className="text-[10px] lg:text-[11px] text-gray-600 font-[500]">USD</span>
                  </div>
                );
              }
              return (
                <div className="flex items-center gap-1">
                  <span className="price text-primary text-[12px] lg:text-[14px] font-[600]">
                    {formatCurrency(item?.price || priceRange?.min)}
                  </span>
                  <span className="text-[10px] lg:text-[11px] text-gray-600 font-[500]">USD</span>
                </div>
              );
            })()
          ) : (
            // Simple product - show single price
            <>
              {item?.isOnSale && item?.oldPrice > item?.price && (
                <div className="flex items-center gap-1">
                  <span className="oldPrice line-through text-gray-500 text-[12px] lg:text-[14px] font-[500]">
                    {formatCurrency(item?.oldPrice)}
                  </span>
                  <span className="text-[10px] lg:text-[11px] text-gray-400 font-[400] line-through">USD</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <span className="price text-primary text-[12px] lg:text-[14px] font-[600]">
                  {formatCurrency(item?.price)}
                </span>
                <span className="text-[10px] lg:text-[11px] text-gray-600 font-[500]">USD</span>
              </div>
            </>
          )}
        </div>


        <div className="!absolute bottom-[15px] left-0 pl-3 pr-3 w-full">

          {
            isAdded === false ?

              <Button 
                className="btn-org addToCartBtn btn-border flex w-full btn-sm gap-2" 
                size="small"
                onClick={() => addToCart(item, context?.userData?._id, quantity)}
                disabled={isOutOfStock()}
                style={{
                  opacity: isOutOfStock() ? 0.5 : 1,
                  cursor: isOutOfStock() ? 'not-allowed' : 'pointer',
                  backgroundColor: isOutOfStock() ? '#ccc' : undefined
                }}
                title={isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}
              >
                <MdOutlineShoppingCart className="text-[18px] lg:text-[18px]" /> 
                <span className="hidden lg:inline">{isOutOfStock() ? 'Out of Stock' : 'Add to Cart'}</span>
              </Button>

              :

              <>
                {
                  isLoading === true ?
                    <Button className="addtocart btn-org btn-border flex w-full btn-sm gap-2 " size="small">
                      <CircularProgress />
                    </Button>

                    :


                    <div className="flex items-center justify-between overflow-hidden rounded-full border border-[rgba(0,0,0,0.1)]">
                      <Button className="!min-w-[35px] !w-[35px] !h-[30px] !bg-[#f1f1f1]  !rounded-none" onClick={minusQty}><FaMinus className="text-[rgba(0,0,0,0.7)]" /></Button>
                      <span>{quantity}</span>
                      <Button className="!min-w-[35px] !w-[35px] !h-[30px] !bg-gray-800 !rounded-none"
                        onClick={addQty}>
                        <FaPlus className="text-white" /></Button>
                    </div>

                }
              </>

          }

        </div>



      </div>
    </div>
  );
};

export default ProductItem;
