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



export const ProductDetailsComponent = (props) => {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isAddedInMyList, setIsAddedInMyList] = useState(false);

  const context = useContext(MyContext);

  const handleSelecteQty = (qty) => {
    setQuantity(qty);
  }


  useEffect(() => {
    const item = context?.cartData?.filter((cartItem) =>
      cartItem.productId.includes(props?.item?._id)
    )

    if (item?.length !== 0) {
      setIsAdded(true)
    } else {
      setIsAdded(false)
    }

  }, [isAdded])


  useEffect(() => {
    const myListItem = context?.myListData?.filter((item) =>
      item.productId.includes(props?.item?._id)
    )


    if (myListItem?.length !== 0) {
      setIsAddedInMyList(true);
    } else {
      setIsAddedInMyList(false)
    }

  }, [context?.myListData])

  const addToCart = (product, userId, quantity) => {


    if (userId === undefined) {
      context?.alertBox("error", "you are not login please login first");
      return false;
    }

    // Determine price: use salePrice if available, fallback to oldPrice, then price
    const displayPrice = product?.salePrice || product?.oldPrice || product?.price;

    const productItem = {
      _id: product?._id,
      productTitle: product?.name,
      image: product?.images[0],
      rating: product?.rating,
      price: displayPrice,
      quantity: quantity,
      subTotal: parseInt(displayPrice * quantity),
      productId: product?._id,
      countInStock: product?.countInStock,
      brand: product?.brand,
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
      const displayPrice = item?.salePrice || item?.oldPrice || item?.price;

      const obj = {
        productId: item?._id,
        userId: context?.userData?._id,
        productTitle: item?.name,
        image: item?.images[0],
        rating: item?.rating,
        price: displayPrice,
        brand: item?.brand,
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
        {props?.item?.name}
      </h1>
      <div className="flex items-start sm:items-center lg:items-center flex-col sm:flex-row md:flex-row lg:flex-row gap-3 justify-start">
        <span className="text-gray-400 text-[13px]">
          Brands :{" "}
          <span className="font-[500] text-black opacity-75">
            {props?.item?.brand}
          </span>
        </span>

        <Rating name="size-small" value={props?.item?.rating} size="small" readOnly />
        <span className="text-[13px] cursor-pointer" onClick={props.gotoReviews}>Review ({props.reviewsCount})</span>
      </div>

      <div className="flex flex-col sm:flex-row md:flex-row lg:flex-row items-start sm:items-center gap-4 mt-4">
        <div className="flex items-center gap-4">
          {props?.item?.salePrice && (
            <>
              <span className="oldPrice line-through text-gray-500 text-[20px] font-[500]">
                {formatCurrency(props?.item?.price)}
              </span>
              <span className="price text-primary text-[20px] font-[600]">
                {formatCurrency(props?.item?.salePrice)}
              </span>
            </>
          )}
          {!props?.item?.salePrice && props?.item?.oldPrice && (
            <>
              <span className="oldPrice line-through text-gray-500 text-[20px] font-[500]">
                {formatCurrency(props?.item?.price)}
              </span>
              <span className="price text-primary text-[20px] font-[600]">
                {formatCurrency(props?.item?.oldPrice)}
              </span>
            </>
          )}
          {!props?.item?.salePrice && !props?.item?.oldPrice && (
            <span className="price text-primary text-[20px] font-[600]">
              {formatCurrency(props?.item?.price)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[14px]">
            Available In Stock:{" "}
            <span className="text-green-600 text-[14px] font-bold">
              {props?.item?.countInStock} Items
            </span>
          </span>
        </div>
      </div>

      <p className="mt-3 pr-10 mb-5">
        {props?.item?.description}
      </p>

      <p className="text-[14px] mt-5 mb-2 text-[#000]">
        Free Shipping (Est. Delivery Time 2-3 Days)
      </p>
      <div className="flex items-center gap-4 py-4">
        <div className="qtyBoxWrapper w-[70px]">
          <QtyBox handleSelecteQty={handleSelecteQty} />
        </div>

        <Button className="btn-org flex gap-2 !min-w-[150px]" onClick={() => addToCart(props?.item, context?.userData?._id, quantity)}>
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
        <span className="flex items-center gap-2 text-[14px] sm:text-[15px] link cursor-pointer font-[500]" onClick={() => handleAddToMyList(props?.item)}>
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
