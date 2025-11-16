import React, { useContext, useEffect, useState } from "react";

import Button from "@mui/material/Button";
import { BsFillBagCheckFill } from "react-icons/bs";
import CartItems from "./cartItems";
import { MyContext } from "../../App";
import { fetchDataFromApi } from "../../utils/api";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/currency";
import ShippingRates from "../../components/ShippingRates/ShippingRates";
import ShippingAddressInput from "../../components/ShippingAddressInput/ShippingAddressInput";

const CartPage = () => {

  const context = useContext(MyContext);
  const [shippingAddress, setShippingAddress] = useState({
    postal_code: '',
    city: '',
    province: '',
    country: 'Canada',
    countryCode: 'CA',
    coordinates: null
  });
  const [selectedShippingRate, setSelectedShippingRate] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Pre-fill address if user has one
    if (context?.userData?.address_details?.[0]) {
      const addr = context.userData.address_details[0];
      setShippingAddress({
        postal_code: addr.postalCode || addr.postal_code || '',
        city: addr.city || '',
        province: addr.provinceCode || addr.province || '',
        country: addr.country || 'CA'
      });
    }
  }, [context?.userData]);




  // Helper to get variation display info (backward compatible)
  const getVariationDisplay = (item) => {
    // New variation system
    if (item?.variation && item.variation.attributes && item.variation.attributes.length > 0) {
      return item.variation.attributes.map(attr => `${attr.name}: ${attr.value}`).join(', ');
    }
    
    // Old system (backward compatibility)
    if (item?.size) return item.size;
    if (item?.weight) return item.weight;
    if (item?.ram) return item.ram;
    
    return null;
  }


  return (
    <section className="section py-4 lg:py-8 pb-10">
      <div className="container w-[80%] max-w-[80%] flex gap-5 flex-col lg:flex-row">
        <div className="leftPart w-full lg:w-[70%]">
          <div className="shadow-md rounded-md bg-white">
            <div className="py-5 px-3 border-b border-[rgba(0,0,0,0.1)]">
              <h2>Your Cart</h2>
              <p className="mt-0 mb-0">
                There are <span className="font-bold text-primary">{context?.cartData?.length}</span>{" "}
                products in your cart
              </p>
            </div>

            {

              context?.cartData?.length !== 0 ? context?.cartData?.map((item, index) => {
                return (
                  <CartItems qty={item?.quantity} item={item} key={index} />
                )
              })

                :



                <>
                  <>
                    <div className="flex items-center justify-center flex-col py-10 gap-5">
                      <img src="/empty-cart.png" className="w-[150px]" />
                      <h4>Your Cart is currently empty</h4>
                      <Link to="/"><Button className="btn-org">Continue Shopping</Button></Link>
                    </div>
                  </>

                </>
            }

          </div>
        </div>

        <div className="rightPart w-full lg:w-[30%]">
          <div className="shadow-md rounded-md bg-white p-5 sticky top-[155px] z-[90]">
            <h3 className="pb-3">Cart Totals</h3>
            <hr />

            <p className="flex items-center justify-between">
              <span className="text-[14px] font-[500]">Subtotal</span>
              <span className="text-primary font-bold">
                {formatCurrency(
                  (context.cartData?.length !== 0 ?
                    context.cartData?.map(item => parseFloat(item.price || 0) * (item.quantity || 0))
                      .reduce((total, value) => total + value, 0) : 0)
                )}
              </span>
            </p>

            {/* Shipping Address Input with Google Maps Autocomplete */}
            <div className="mt-4 mb-4">
              <ShippingAddressInput
                onAddressChange={(newAddress) => {
                  setShippingAddress({
                    postal_code: newAddress.postal_code,
                    city: newAddress.city,
                    province: newAddress.province,
                    country: newAddress.country,
                    countryCode: newAddress.countryCode,
                    coordinates: newAddress.coordinates
                  });
                }}
                initialAddress={shippingAddress}
              />
            </div>

            {/* Shipping Rates */}
            {context.cartData?.length > 0 && (
              <ShippingRates
                cartItems={context.cartData}
                shippingAddress={shippingAddress}
                onRateSelected={setSelectedShippingRate}
              />
            )}

            <hr className="my-4" />

            <p className="flex items-center justify-between">
              <span className="text-[14px] font-[500]">Shipping</span>
              <span className="font-bold">
                {selectedShippingRate ? (
                  formatCurrency(selectedShippingRate.cost)
                ) : (
                  <span className="text-gray-400">Enter address</span>
                )}
              </span>
            </p>

            <p className="flex items-center justify-between">
              <span className="text-[14px] font-[500]">Total</span>
              <span className="text-primary font-bold">
                {formatCurrency(
                  (context.cartData?.length !== 0 ?
                    context.cartData?.map(item => parseFloat(item.price || 0) * (item.quantity || 0))
                      .reduce((total, value) => total + value, 0) : 0) +
                  (selectedShippingRate ? selectedShippingRate.cost : 0)
                )}
              </span>
            </p>

            <br />

            {/* Validate address and shipping rate before allowing checkout */}
            {(() => {
              const hasValidAddress = shippingAddress && (
                (shippingAddress.postal_code && shippingAddress.city) ||
                (shippingAddress.city && shippingAddress.countryCode)
              );
              const hasShippingRate = selectedShippingRate && selectedShippingRate.cost > 0;
              
              if (!hasValidAddress || !hasShippingRate) {
                return (
                  <Button 
                    className="btn-org btn-lg w-full flex gap-2" 
                    disabled
                    onClick={() => {
                      if (!hasValidAddress) {
                        context?.alertBox("error", "Please enter a complete shipping address (city and country required)");
                      } else if (!hasShippingRate) {
                        context?.alertBox("error", "Please wait for shipping rates to calculate, or enter a valid address");
                      }
                    }}
                  >
                    <BsFillBagCheckFill className="text-[20px]" /> 
                    {!hasValidAddress ? "Enter Shipping Address" : "Calculating Shipping..."}
                  </Button>
                );
              }
              
              return (
                <Link to="/checkout" state={{ selectedShippingRate, shippingAddress }}>
                  <Button className="btn-org btn-lg w-full flex gap-2">
                    <BsFillBagCheckFill className="text-[20px]" /> Checkout
                  </Button>
                </Link>
              );
            })()}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CartPage;
