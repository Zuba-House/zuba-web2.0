

import React, { useContext, useEffect, useState } from "react";
import { Button } from "@mui/material";
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
  const [selectedAddressData, setSelectedAddressData] = useState(null);
  // numeric total for server payloads
  const [totalAmount, setTotalAmount] = useState(0);
  const [showStripeForm, setShowStripeForm] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false); // Prevent double-click on order creation
  const [selectedShippingRate, setSelectedShippingRate] = useState(null);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const context = useContext(MyContext);

  const history = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    setUserData(context?.userData);
    
    // Set initial address if available
    if (context?.userData?.address_details?.[0]) {
      const firstAddress = context.userData.address_details[0];
      setSelectedAddress(firstAddress._id);
      setSelectedAddressData(firstAddress);
      
      // Set phone from address if available
      if (firstAddress?.contactInfo?.phone) {
        setPhone(firstAddress.contactInfo.phone);
      }
    }
    
    // Get shipping rate from location state (passed from Cart page) - fallback
    if (location.state?.selectedShippingRate && !selectedShippingRate) {
      setSelectedShippingRate(location.state.selectedShippingRate);
    }
  }, [context?.userData, location.state]);

  // Calculate shipping when address is selected and cart is available
  useEffect(() => {
    if (selectedAddressData && context?.cartData?.length > 0 && !loadingShipping) {
      // Use a small delay to avoid multiple calls
      const timer = setTimeout(() => {
        calculateShipping(selectedAddressData);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedAddressData?._id, context?.cartData?.length]);


  useEffect(() => {
    const subtotal = context.cartData?.length !== 0 ?
      context.cartData?.map(item => parseFloat(item.price || 0) * (item.quantity || 0))
        .reduce((sum, value) => sum + value, 0) : 0;
    
    const shippingCost = selectedShippingRate ? (selectedShippingRate.cost || selectedShippingRate.price || 0) : 0;
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
      const addressId = e.target.value;
      setSelectedAddress(addressId);
      
      // Get full address data
      const address = userData?.address_details?.find(addr => addr._id === addressId);
      setSelectedAddressData(address);
      
      // Set phone from address if available
      if (address?.contactInfo?.phone) {
        setPhone(address.contactInfo.phone);
        setPhoneError('');
      }
      
      // Calculate shipping for this address
      if (address && context?.cartData?.length > 0) {
        calculateShipping(address);
      }
    }
  }

  // Calculate shipping using new comprehensive calculator
  const calculateShipping = async (address) => {
    if (!address || !context?.cartData || context.cartData.length === 0) {
      return;
    }

    setLoadingShipping(true);
    
    try {
      // Prepare shipping address for calculator
      const shippingAddress = {
        countryCode: address?.address?.countryCode || address?.countryCode || 'CA',
        country: address?.address?.country || address?.country || 'Canada',
        province: address?.address?.provinceCode || address?.provinceCode || address?.address?.province || address?.province || '',
        city: address?.address?.city || address?.city || '',
        postalCode: address?.address?.postalCode || address?.postalCode || ''
      };

      // Fetch product data for cart items to get category and weight
      const cartItemsWithProducts = await Promise.all(
        context.cartData.map(async (item) => {
          try {
            // Try to get product data if not already available
            let productData = item.product;
            if (!productData && item.productId) {
              const productResponse = await fetchDataFromApi(`/api/product/${item.productId}`);
              productData = productResponse?.product || productResponse;
            }
            
            return {
              product: productData || {},
              productId: item.productId,
              quantity: item.quantity || 1,
              price: item.price
            };
          } catch (error) {
            console.warn('Error fetching product data:', error);
            return {
              product: {},
              productId: item.productId,
              quantity: item.quantity || 1,
              price: item.price
            };
          }
        })
      );

      const response = await postData('/api/shipping/calculate', {
        cartItems: cartItemsWithProducts,
        shippingAddress: shippingAddress
      });

      if (response?.success && response?.options && response.options.length > 0) {
        setShippingOptions(response.options);
        // Auto-select first option (usually standard)
        const selectedOption = {
          ...response.options[0],
          cost: response.options[0].price
        };
        setSelectedShippingRate(selectedOption);
      } else {
        setShippingOptions([]);
        setSelectedShippingRate(null);
        if (response?.message) {
          context?.alertBox("error", response.message);
        }
      }
    } catch (error) {
      console.error('Shipping calculation error:', error);
      setShippingOptions([]);
      setSelectedShippingRate(null);
      context?.alertBox("error", "Failed to calculate shipping rates. Please try again.");
    } finally {
      setLoadingShipping(false);
    }
  };

  // Validate phone number
  const validatePhone = async (phoneNumber) => {
    if (!phoneNumber || phoneNumber.trim() === '') {
      setPhoneError('Phone number is required');
      return false;
    }

    try {
      const response = await postData('/api/shipping/validate-phone', {
        phone: phoneNumber,
        country: selectedAddressData?.address?.countryCode || 'CA'
      });

      if (response?.success && response?.valid) {
        setPhoneError('');
        if (response?.formatted) {
          setPhone(response.formatted);
        }
        return true;
      } else {
        setPhoneError(response?.message || 'Invalid phone number format');
        return false;
      }
    } catch (error) {
      console.error('Phone validation error:', error);
      setPhoneError('Unable to validate phone number');
      return false;
    }
  };



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


  const handleStripeSuccess = async (paymentIntent) => {
    // Prevent double-click / multiple submissions
    if (isProcessingOrder) {
      console.log('⚠️ Order is already being processed, please wait...');
      return;
    }

    // Validate cart before proceeding
    if (!validateCartStock()) {
      return;
    }

    // Validate shipping address and rate
    if (!selectedShippingRate || (!selectedShippingRate.cost && !selectedShippingRate.price)) {
      context?.alertBox("error", "Please select a shipping method");
      return;
    }

    // Validate phone number
    if (!phone || phone.trim() === '') {
      context?.alertBox("error", "Phone number is required for shipping");
      setPhoneError('Phone number is required');
      return;
    }

    const phoneValid = await validatePhone(phone);
    if (!phoneValid) {
      context?.alertBox("error", "Please enter a valid phone number");
      return;
    }

    const user = context?.userData;
    if (userData?.address_details?.length === 0) {
      context.alertBox("error", "Please add a delivery address before proceeding");
      return;
    }

    // Set processing state to prevent double-click
    setIsProcessingOrder(true);

    // Calculate total amount including shipping (use totalAmount state which already includes shipping)
    const subtotal = context.cartData?.length > 0
      ? context.cartData.map(item => parseFloat(item.price || 0) * (item.quantity || 0)).reduce((a, b) => a + b, 0)
      : 0;
    const shippingCost = selectedShippingRate ? (selectedShippingRate.cost || selectedShippingRate.price || 0) : 0;
    const finalTotal = subtotal + shippingCost;
    
    console.log('Order creation - Amounts:', {
      subtotal,
      shippingCost,
      finalTotal,
      paymentIntentAmount: paymentIntent?.amount ? paymentIntent.amount / 100 : 0,
      totalAmountState: totalAmount
    });

    const payLoad = {
      userId: user?._id,
      products: context?.cartData,
      paymentId: paymentIntent?.id || '',
      payment_status: "COMPLETED",
      delivery_address: selectedAddress,
      totalAmt: finalTotal, // Use calculated total with shipping
      shippingCost: shippingCost,
      shippingRate: selectedShippingRate,
      phone: phone, // Include phone number
      date: new Date().toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
    };

    try {
      console.log('📦 Creating order after successful payment...');
      console.log('📦 Payment Intent ID:', paymentIntent?.id);
      console.log('📦 Order payload:', { 
        userId: user?._id, 
        productCount: context?.cartData?.length,
        totalAmt: finalTotal 
      });
      
      const res = await postData(`/api/order/create`, payLoad);
      
      console.log('📦 Order creation response:', res);
      console.log('📦 Response error field:', res?.error);
      console.log('📦 Response success field:', res?.success);
      
      // Check multiple response formats for compatibility
      const isSuccess = res?.error === false || res?.success === true || res?.orderId || (res && !res.error);
      
      if (isSuccess) {
        console.log('✅ Order created successfully!');
        
        // Clear cart in background (don't wait for it)
        try {
          deleteData(`/api/cart/emptyCart/${user?._id}`).catch(err => {
            console.warn('⚠️ Cart clear failed (non-critical):', err);
          });
        } catch {
          // ignore cart empty errors but still proceed
        }
        
        context?.getCartItems();
        
        // IMMEDIATE redirect - don't wait for alertBox or other UI updates
        console.log('✅ Order created! Redirecting immediately to success page...');
        
        // Redirect immediately - don't wait for alertBox
        window.location.href = "/order/success";
        
        // If redirect somehow doesn't work, force it after 100ms
        setTimeout(() => {
          if (window.location.pathname !== '/order/success') {
            console.warn('⚠️ Redirect did not happen, forcing redirect...');
            window.location.replace("/order/success");
          }
        }, 100);
      } else {
        console.error('❌ Order creation failed:', res);
        console.error('❌ Response details:', JSON.stringify(res, null, 2));
        context.alertBox("error", res?.message || "Failed to create order");
        setIsProcessingOrder(false); // Re-enable on error
        setTimeout(() => {
          window.location.href = "/order/failed";
        }, 500);
      }
    } catch (error) {
      console.error('❌ Error creating order:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        paymentIntentId: paymentIntent?.id
      });
      
      // Even if order creation fails, payment succeeded - check if we should still redirect to success
      // This is a fallback: payment succeeded, so we should at least show success page
      console.warn('⚠️ Order creation error, but payment succeeded. Checking if order was created anyway...');
      
      // Try to redirect to success anyway since payment succeeded
      // The order might have been created but response was malformed
      context.alertBox("warning", "Payment succeeded. If you don't see your order, please contact support with payment ID: " + (paymentIntent?.id || 'N/A'));
      setIsProcessingOrder(false); // Re-enable on error
      
      // Redirect to success since payment succeeded
      setTimeout(() => {
        window.location.href = "/order/success";
      }, 1000);
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

              {/* Phone Number - REQUIRED */}
              {selectedAddress && selectedAddressData && (
                <div className="mt-4">
                  <label htmlFor="phone" className="block text-[14px] font-[600] mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setPhoneError('');
                    }}
                    onBlur={(e) => {
                      if (e.target.value) {
                        validatePhone(e.target.value);
                      }
                    }}
                    placeholder="+1-613-555-0100"
                    required
                    className={`w-full px-4 py-2.5 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-primary ${
                      phoneError ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {phoneError && (
                    <span className="text-red-500 text-[12px] mt-1 block">{phoneError}</span>
                  )}
                  <small className="text-gray-600 text-[12px] mt-1 block">
                    Required for shipping label. Format: +1-XXX-XXX-XXXX
                  </small>
                </div>
              )}

              {/* Shipping Options */}
              {selectedAddress && selectedAddressData && (
                <div className="mt-4">
                  <h3 className="text-[16px] font-[600] mb-3">Shipping Method</h3>
                  
                  {loadingShipping ? (
                    <div className="flex items-center justify-center py-4">
                      <CircularProgress size={24} />
                      <span className="ml-2 text-[14px] text-gray-600">Calculating shipping...</span>
                    </div>
                  ) : shippingOptions.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {shippingOptions.map((option) => (
                        <div
                          key={option.id}
                          onClick={() => {
                            setSelectedShippingRate({
                              ...option,
                              cost: option.price
                            });
                          }}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedShippingRate?.id === option.id
                              ? 'border-primary bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[18px]">{option.icon}</span>
                                <strong className="text-[15px] font-[600]">{option.name}</strong>
                              </div>
                              <p className="text-[13px] text-gray-600 mb-1">{option.description}</p>
                              <p className="text-[12px] text-green-600 font-[500] mb-1">
                                Estimated: {option.estimatedDelivery}
                              </p>
                              <p className="text-[12px] text-gray-500">{option.deliveryDays}</p>
                            </div>
                            <div className="text-right ml-4">
                              <strong className="text-[20px] font-[700] text-primary">
                                {formatCurrency(option.price)}
                              </strong>
                              <p className="text-[12px] text-gray-500">{option.currency}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-[14px] text-yellow-800">
                        No shipping options available. Please check your address or try again.
                      </p>
                    </div>
                  )}
                </div>
              )}

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
                      formatCurrency(selectedShippingRate.cost || selectedShippingRate.price || 0)
                    ) : (
                      <span className="text-gray-400">Select address</span>
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
                              const shippingCost = selectedShippingRate ? (selectedShippingRate.cost || selectedShippingRate.price || 0) : 0;
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
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Checkout;
