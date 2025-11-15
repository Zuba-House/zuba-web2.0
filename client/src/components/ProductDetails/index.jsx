import React, { useContext, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { QtyBox } from "../QtyBox";
import Rating from "@mui/material/Rating";
import { MdOutlineShoppingCart } from "react-icons/md";
import { FaRegHeart } from "react-icons/fa";
import { IoGitCompareOutline } from "react-icons/io5";
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
      context?.alertBox("error", "you are not login please login first");
      return false;
    }

    // For variable products, check if variation is selected
    if (product?.productType === 'variable' && !selectedVariation) {
      context?.alertBox("error", "Please select a variation (size, color, etc.)");
      return false;
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
    if (stock < quantity) {
      context?.alertBox("error", `Only ${stock} items available in stock`);
      return false;
    }

    const productItem = {
      _id: selectedVariation?._id || product?._id,
      productId: product?._id,
      variationId: selectedVariation?._id || null,
      productTitle: product?.name,
      image: selectedVariation?.image || product?.images?.[0] || product?.featuredImage || '',
      rating: product?.rating,
      price: displayPrice,
      quantity: quantity,
      subTotal: parseFloat(displayPrice * quantity).toFixed(2),
      countInStock: stock,
      brand: product?.brand,
      variation: selectedVariation ? {
        attributes: selectedVariation.attributes,
        sku: selectedVariation.sku
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
    <>
      <h1 className="text-[18px] sm:text-[22px] font-[600] mb-2">
        {product?.name}
      </h1>
      <div className="flex items-start sm:items-center lg:items-center flex-col sm:flex-row md:flex-row lg:flex-row gap-3 justify-start">
        <span className="text-gray-400 text-[13px]">
          Brands :{" "}
          <span className="font-[500] text-black opacity-75">
            {product?.brand}
          </span>
        </span>

        <Rating name="size-small" value={product?.rating} size="small" readOnly />
        <span className="text-[13px] cursor-pointer" onClick={props.gotoReviews}>Review ({props.reviewsCount})</span>
      </div>

      <div className="flex flex-col sm:flex-row md:flex-row lg:flex-row items-start sm:items-center gap-4 mt-4">
        <div className="flex items-center gap-4">
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
                  <span className="oldPrice line-through text-gray-500 text-[20px] font-[500]">
                    {formatCurrency(regularPrice)}
                  </span>
                  <span className="price text-primary text-[20px] font-[600]">
                    {formatCurrency(salePrice)}
                  </span>
                </>
              );
            } else {
              // No sale - show regular price only
              return (
                <span className="price text-primary text-[20px] font-[600]">
                  {formatCurrency(regularPrice)}
                </span>
              );
            }
          })()}
        </div>
      </div>

      <p className="mt-3 pr-10 mb-5">
        {product?.description}
      </p>

      {/* Product Variations */}
      {product?.productType === 'variable' && (
        <ProductVariations 
          product={product} 
          onVariationSelect={setSelectedVariation}
          selectedVariation={selectedVariation}
        />
      )}

      {/* Stock display - update based on selected variation */}
      <div className="flex items-center gap-4 mt-4">
        <span className="text-[14px]">
          Available In Stock:{" "}
          <span className={`text-[14px] font-bold ${
            (selectedVariation ? selectedVariation.stock : (product?.countInStock || product?.stock)) > 0 
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {selectedVariation 
              ? `${selectedVariation.stock} Items` 
              : `${product?.countInStock || product?.stock} Items`}
          </span>
        </span>
      </div>

      <p className="text-[14px] mt-5 mb-2 text-[#000]">
        Free Shipping (Est. Delivery Time 2-3 Days)
      </p>
      <div className="flex items-center gap-4 py-4">
        <div className="qtyBoxWrapper w-[70px]">
          <QtyBox handleSelecteQty={handleSelecteQty} />
        </div>

        <Button className="btn-org flex gap-2 !min-w-[150px]" onClick={() => addToCart(product, context?.userData?._id, quantity)}>
          {
            isLoading === true ? <CircularProgress /> :
              <>
                {
                  isAdded === true ? <><FaCheckDouble /> Added</> :
                    <>
                      <MdOutlineShoppingCart className="text-[22px]" /> Add to Cart
                    </>
                }

              </>
          }

        </Button>
      </div>

      <div className="flex items-center gap-4 mt-4">
        <span className="flex items-center gap-2 text-[14px] sm:text-[15px] link cursor-pointer font-[500]" onClick={() => handleAddToMyList(product)}>
          {
            isAddedInMyList === true ? <IoMdHeart className="text-[18px] !text-primary group-hover:text-white hover:!text-white" /> :
              <FaRegHeart className="text-[18px] !text-black group-hover:text-white hover:!text-white" />

          }
          Add to Wishlist
        </span>

        <span className="flex items-center gap-2  text-[14px] sm:text-[15px] link cursor-pointer font-[500]">
          <IoGitCompareOutline className="text-[18px]" /> Add to Compare
        </span>
      </div>
    </>
  );
};
