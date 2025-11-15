import React, { useContext, useEffect, useState } from "react";
import "../ProductItem/style.css";
import { Link } from "react-router-dom";
import Rating from "@mui/material/Rating";
import Button from "@mui/material/Button";
import { FaRegHeart } from "react-icons/fa";
import { IoGitCompareOutline } from "react-icons/io5";
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



const ProductItem = (props) => {
  // Normalize product data for backward compatibility
  const item = normalizeProduct(props?.item);

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
    const normalizedProduct = normalizeProduct(product);
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


  return (
    <div className="productItem shadow-lg rounded-md overflow-hidden border-1 border-[rgba(0,0,0,0.1)]">
      <div className="group imgWrapper w-[100%]  overflow-hidden  rounded-md rounded-bl-none rounded-br-none relative">
        <Link to={`/product/${item?._id}`}>
          <div className="img h-[200px] overflow-hidden">
            <img
              src={item?.featuredImage || (item?.images && item?.images[0] ? (typeof item.images[0] === 'string' ? item.images[0] : item.images[0].url) : '')}
              className="w-full"
              alt={item?.name || ''}
            />

            {
              item?.images?.length > 1 &&
              <img
                src={typeof item.images[1] === 'string' ? item.images[1] : item.images[1]?.url}
                className="w-full transition-all duration-700 absolute top-0 left-0 opacity-0 group-hover:opacity-100 group-hover:scale-105"
                alt={item?.name || ''}
              />
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

          <Button className="!w-[35px] !h-[35px] !min-w-[35px] !rounded-full !bg-white  text-black hover:!bg-primary hover:text-white group" onClick={() => context.handleOpenProductDetailsModal(true, item)}>
            <MdZoomOutMap className="text-[18px] !text-black group-hover:text-white hover:!text-white" />
          </Button>

          <Button className="!w-[35px] !h-[35px] !min-w-[35px] !rounded-full !bg-white  text-black hover:!bg-primary hover:text-white group">
            <IoGitCompareOutline className="text-[18px] !text-black group-hover:text-white hover:!text-white" />
          </Button>

          <Button className={`!w-[35px] !h-[35px] !min-w-[35px] !rounded-full !bg-white  text-black hover:!bg-primary hover:text-white group`}
            onClick={() => handleAddToMyList(item)}
          >
            {
              isAddedInMyList === true ? <IoMdHeart className="text-[18px] !text-primary group-hover:text-white hover:!text-white" /> :
                <FaRegHeart className="text-[18px] !text-black group-hover:text-white hover:!text-white" />

            }

          </Button>
        </div>
      </div>

      <div className="info p-3 py-5 relative pb-[50px] h-[190px]">
        <h6 className="text-[13px] !font-[400]">
          <span className="link transition-all">
            {item?.brand}
          </span>
        </h6>
        <h3 className="text-[12px] lg:text-[13px] title mt-1 font-[500] mb-1 text-[#000]">
          <Link to={`/product/${item?._id}`} className="link transition-all">
            {item?.name?.substring(0, 25) + (item?.name?.length > 25 ? '...' : '')}
          </Link>
        </h3>

        <Rating name="size-small" defaultValue={item?.rating} size="small" readOnly />

        <div className="flex items-center gap-4 justify-between">
          {item?.isOnSale && item?.oldPrice > item?.price && (
            <span className="oldPrice line-through text-gray-500 text-[12px] lg:text-[14px] font-[500]">
              {formatCurrency(item?.oldPrice)}
            </span>
          )}
          <span className="price text-primary text-[12px] lg:text-[14px]  font-[600]">
            {formatCurrency(item?.price)}
          </span>
        </div>


        <div className="!absolute bottom-[15px] left-0 pl-3 pr-3 w-full">

          {
            isAdded === false ?

              <Button className="btn-org addToCartBtn btn-border flex w-full btn-sm gap-2 " size="small"
                onClick={() => addToCart(item, context?.userData?._id, quantity)}>
                <MdOutlineShoppingCart className="text-[18px]" /> Add to Cart
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
