

import React, { useContext, useEffect, useState } from "react";
import { Button } from "@mui/material";
import { BsFillBagCheckFill } from "react-icons/bs";
import { MyContext } from '../../App';
import { FaPlus } from "react-icons/fa6";
import Radio from '@mui/material/Radio';
import { deleteData, fetchDataFromApi, postData } from "../../utils/api";
import axios from 'axios';
import { useNavigate, useLocation } from "react-router-dom";
import CircularProgress from '@mui/material/CircularProgress';
import StripeCheckout from "../../components/StripeCheckout.jsx";
import { formatCurrency } from "../../utils/currency";

const VITE_API_URL = import.meta.env.VITE_API_URL;

const Checkout = () => {

  const [userData, setUserData] = useState(null);
  const [isChecked, setIsChecked] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState("");
  // numeric total for server payloads
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsloading] = useState(false);
  const [showStripeForm, setShowStripeForm] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [selectedShippingRate, setSelectedShippingRate] = useState(null);
  const context = useContext(MyContext);

  const history = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    setUserData(context?.userData)
    setSelectedAddress(context?.userData?.address_details[0]?._id);
    
    // Get shipping rate from location state (passed from Cart page)
    if (location.state?.selectedShippingRate) {
      setSelectedShippingRate(location.state.selectedShippingRate);
    }
  }, [context?.userData, userData, location.state])


  useEffect(() => {
    const subtotal = context.cartData?.length !== 0 ?
      context.cartData?.map(item => parseFloat(item.price || 0) * (item.quantity || 0))
        .reduce((sum, value) => sum + value, 0) : 0;
    
    const shippingCost = selectedShippingRate ? selectedShippingRate.cost : 0;
    const total = subtotal + shippingCost;
    
    // keep numeric for backend; format only when rendering
    setTotalAmount(total);
  }, [context.cartData, selectedShippingRate])





  // Removed PayPal integration

  const editAddress = (id) => {
    context?.setOpenAddressPanel(true);
    context?.setAddressMode("edit");
    context?.setAddressId(id);
  }


  const handleChange = (e, index) => {
    if (e.target.checked) {
      setIsChecked(index);
      setSelectedAddress(e.target.value)
    }
  }



  // Removed Razorpay integration

  // Validate cart before checkout
  const validateCartStock = () => {
    // Check if cart is empty
    if (!context.cartData || context.cartData.length === 0) {
      context?.alertBox("error", "Your cart is empty");
      return false;
    }
    
    // Check for out-of-stock items
    const outOfStockItems = context.cartData.filter(item => item.isOutOfStock);
    if (outOfStockItems.length > 0) {
      const itemNames = outOfStockItems.map(item => item.productTitle).join(', ');
      context?.alertBox(
        "error",
        `Cannot proceed. The following items are out of stock: ${itemNames}. Please remove them from your cart.`
      );
      return false;
    }
    
    // Check if quantities exceed stock
    const exceededStock = context.cartData.filter(item => item.quantity > (item.currentStock || item.countInStock));
    if (exceededStock.length > 0) {
      context?.alertBox(
        "error",
        "Some items in your cart exceed available stock. Please adjust quantities."
      );
      return false;
    }
    
    return true;
  };

  const cashOnDelivery = () => {
    // Validate cart before proceeding
    if (!validateCartStock()) {
      return;
    }

    const user = context?.userData
    setIsloading(true);

    if (userData?.address_details?.length !== 0) {
      const payLoad = {
        userId: user?._id,
        products: context?.cartData,
        paymentId: '',
        payment_status: "CASH ON DELIVERY",
        delivery_address: selectedAddress,
        totalAmt: totalAmount,
        shippingCost: selectedShippingRate ? selectedShippingRate.cost : 0,
        shippingRate: selectedShippingRate,
        date: new Date().toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })
      };


      postData(`/api/order/create`, payLoad).then((res) => {
        context.alertBox("success", res?.message);

        if (res?.error === false) {
          deleteData(`/api/cart/emptyCart/${user?._id}`).then((res) => {
            context?.getCartItems();
            setIsloading(false);
          })
        } else {
          context.alertBox("error", res?.message);
        }
        history("/order/success");
      });
    } else {
      context.alertBox("error", "Please add address");
      setIsloading(false);
    }



  }

  const handleStripeSuccess = async (paymentIntent) => {
    // Validate cart before proceeding
    if (!validateCartStock()) {
      return;
    }

    const user = context?.userData;
    if (userData?.address_details?.length === 0) {
      context.alertBox("error", "Please add address");
      return;
    }

    const payLoad = {
      userId: user?._id,
      products: context?.cartData,
      paymentId: paymentIntent?.id || '',
      payment_status: "COMPLETED",
      delivery_address: selectedAddress,
      totalAmt: paymentIntent?.amount ? paymentIntent.amount / 100 : 0,
      shippingCost: selectedShippingRate ? selectedShippingRate.cost : 0,
      shippingRate: selectedShippingRate,
      date: new Date().toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
    };

    try {
      const res = await postData(`/api/order/create`, payLoad);
      context.alertBox("success", res?.message);
      if (res?.error === false) {
        try {
          await deleteData(`/api/cart/emptyCart/${user?._id}`);
        } catch {
          // ignore cart empty errors but still proceed
        }
        context?.getCartItems();
        history("/order/success");
      } else {
        context.alertBox("error", res?.message);
        history("/order/failed");
      }
    } catch {
      context.alertBox("error", "Failed to record order");
      history("/order/failed");
    }
  }

  const handleStripeFailed = async (error) => {
    const user = context?.userData;
    if (userData?.address_details?.length === 0) {
      return;
    }
    const fail = error || {};
    const pi = fail?.payment_intent || fail?.paymentIntent || {};
    const lastErr = pi?.last_payment_error || {};
    const payLoad = {
      userId: user?._id,
      products: context?.cartData,
      paymentId: pi?.id || '',
      payment_status: "FAILED",
      delivery_address: selectedAddress,
      totalAmt: totalAmount,
      date: new Date().toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
      failReason: lastErr?.message || fail?.message || 'Stripe payment failed',
      failCode: fail?.code || lastErr?.code || '',
      failType: fail?.type || lastErr?.type || '',
      failDeclineCode: fail?.decline_code || lastErr?.decline_code || ''
    };

    try {
      await postData(`/api/order/create`, payLoad);
    } catch {
      /* ignore */
    }
  }

  return (
    <section className="py-3 lg:py-10 px-3">
      <div>
        <div className="w-full lg:w-[70%] m-auto flex flex-col md:flex-row gap-5">
          <div className="leftCol w-full md:w-[60%]">
            <div className="card bg-white shadow-md p-5 rounded-md w-full">
              <div className="flex items-center justify-between">
                <h2>Select Delivery Address</h2>
                {
                  userData?.address_details?.length !== 0 &&
                  <Button variant="outlined"
                    onClick={() => {
                      context?.setOpenAddressPanel(true);
                      context?.setAddressMode("add");
                    }} className="btn">
                    <FaPlus />
                    ADD {context?.windowWidth< 767 ? '' : 'NEW ADDRESS'}
                  </Button>
                }

              </div>

              <br />

              <div className="flex flex-col gap-4">


                {
                  userData?.address_details?.length !== 0 ? userData?.address_details?.map((address, index) => {

                    return (
                      <label className={`flex gap-3 p-4 border border-[rgba(0,0,0,0.1)] rounded-md relative ${isChecked === index && 'bg-[#fff2f2]'}`} key={index}>
                        <div>
                          <Radio size="small" onChange={(e) => handleChange(e, index)}
                            checked={isChecked === index} value={address?._id} />
                        </div>
                        <div className="info flex-1">
                          <span className="inline-block text-[13px] font-[500] p-1 bg-[#f1f1f1] rounded-md mb-2">
                            {address?.label || address?.addressType || 'Home'}
                          </span>
                          <h3 className="font-[600] mb-1">
                            {address?.contactInfo?.firstName 
                              ? `${address.contactInfo.firstName} ${address.contactInfo.lastName || ''}`.trim()
                              : userData?.name
                            }
                          </h3>
                          <p className="mt-0 mb-1 text-[14px] text-gray-700">
                            {address?.address?.addressLine1 
                              ? `${address.address.addressLine1}${address.address.addressLine2 ? ', ' + address.address.addressLine2 : ''}, ${address.address.city}, ${address.address.provinceCode} ${address.address.postalCode}, ${address.address.country}`
                              : `${address?.address_line1 || ''} ${address?.city || ''} ${address?.country || ''} ${address?.state || ''} ${address?.landmark || ''}`.trim()
                            }
                          </p>
                          <p className="mb-0 font-[500] text-[14px]">
                            {address?.contactInfo?.phone 
                              ? address.contactInfo.phone 
                              : (address?.mobile ? `+${address.mobile}` : (userData?.mobile ? `+${userData.mobile}` : ''))
                            }
                          </p>
                        </div>

                        <Button variant="text" className="!absolute top-[15px] right-[15px]" size="small"
                          onClick={() => editAddress(address?._id)}
                        >EDIT</Button>

                      </label>
                    )
                  })

                    :


                    <>
                      <div className="flex items-center mt-5 justify-between flex-col p-5">
                        <img src="/map.png" width="100" />
                        <h2 className="text-center">No Addresses found in your account!</h2>
                        <p className="mt-0">Add a delivery address.</p>
                        <Button className="btn-org" 
                        onClick={() => {
                          context?.setOpenAddressPanel(true);
                          context?.setAddressMode("add");
                        }}>ADD ADDRESS</Button>
                      </div>
                    </>

                }

              </div>


            </div>
          </div>

          <div className="rightCol w-full  md:w-[40%]">
            <div className="card shadow-md bg-white p-5 rounded-md">
              <h2 className="mb-4">Your Order</h2>

              <div className="flex items-center justify-between py-3 border-t border-b border-[rgba(0,0,0,0.1)]">
                <span className="text-[14px] font-[600]">Product</span>
                <span className="text-[14px] font-[600]">Subtotal</span>
              </div>

              <div className="mb-5 scroll max-h-[250px] overflow-y-scroll overflow-x-hidden pr-2">

                {
                  context?.cartData?.length !== 0 && context?.cartData?.map((item, index) => {
                    return (
                      <div className="flex items-center justify-between py-2" key={index}>
                        <div className="part1 flex items-center gap-3">
                          <div className="img w-[50px] h-[50px] object-cover overflow-hidden rounded-md group cursor-pointer">
                            <img
                              src={item?.image}
                              className="w-full transition-all group-hover:scale-105"
                            />
                          </div>

                          <div className="info">
                            <h4 className="text-[14px]" title={item?.productTitle}>{item?.productTitle?.substr(0, 20) + '...'} </h4>
                            <span className="text-[13px]">Qty : {item?.quantity}</span>
                          </div>
                        </div>

                        <span className="text-[14px] font-[500]">{formatCurrency(item?.quantity * item?.price)}</span>
                      </div>
                    )
                  })
                }



              </div>

              {/* Order Summary Totals */}
              <div className="border-t border-[rgba(0,0,0,0.1)] pt-3 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-[500]">Subtotal</span>
                  <span className="text-[14px] font-[600]">
                    {formatCurrency(
                      context.cartData?.length !== 0 ?
                        context.cartData?.map(item => parseFloat(item.price || 0) * (item.quantity || 0))
                          .reduce((total, value) => total + value, 0) : 0
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-[500]">Shipping</span>
                  <span className="text-[14px] font-[600]">
                    {selectedShippingRate ? (
                      formatCurrency(selectedShippingRate.cost)
                    ) : (
                      <span className="text-gray-400">Not calculated</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[rgba(0,0,0,0.1)]">
                  <span className="text-[16px] font-[700]">Total</span>
                  <span className="text-[16px] font-[700] text-primary">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center flex-col gap-3 mb-2">
                <div className="flex flex-col w-full items-center gap-3 mt-3">
                  <Button
                    className="btn-org btn-lg w-full flex gap-2 items-center"
                    onClick={() => {
                      setShowStripeForm((prev) => !prev);
                      setTimeout(() => {
                        const el = document.getElementById("stripe-payment-box");
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                      }, 600);
                    }}
                    disabled={isPaying}
                  >
                    {showStripeForm ? "Hide Card Form" : "Place Order (Card)"}
                  </Button>

                  {showStripeForm && (
                    <div
                      id="stripe-payment-box"
                      className="w-full p-4 mt-2 bg-[#f9f9f9] border border-gray-200 rounded-md shadow-sm"
                    >
                      <StripeCheckout
                        amount={
                          (() => {
                            try {
                              const subtotal = context.cartData?.length > 0
                                ? context.cartData
                                  .map((item) => (item.price || 0) * (item.quantity || 0))
                                  .reduce((a, b) => a + b, 0)
                                : 0;
                              const shippingCost = selectedShippingRate ? selectedShippingRate.cost : 0;
                              const total = subtotal + shippingCost;
                              const amount = parseFloat(total?.toFixed(2)) || 0;
                              return amount > 0 ? amount : 0;
                            } catch (e) {
                              console.error("Error calculating cart total:", e);
                              return 0;
                            }
                          })()
                        }
                        onPaid={(paymentIntent) => handleStripeSuccess(paymentIntent)}
                        onFailed={(err) => handleStripeFailed(err)}
                        onProcessingChange={setIsPaying}
                        onReady={() => {
                          const el = document.getElementById("stripe-payment-box");
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                        }}
                      />

                      <p className="text-[13px] text-center mt-3 text-gray-600">
                        💳 All payments are securely processed by Stripe.
                      </p>
                    </div>
                  )}
                </div>

                <Button type="button" className="btn-dark btn-lg w-full flex gap-2 items-center" onClick={cashOnDelivery}>
                  {
                    isLoading === true ? <CircularProgress /> :
                      <>
                        <BsFillBagCheckFill className="text-[20px]" />
                        Cash on Delivery
                      </>
                  }
                </Button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Checkout;
