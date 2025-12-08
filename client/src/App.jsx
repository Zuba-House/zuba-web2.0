import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, Link, useLocation } from "react-router-dom";
import Button from "@mui/material/Button";
import emailjs from '@emailjs/browser';
import "./App.css";
import "./responsive.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./Pages/Home";
import ProductListing from "./Pages/ProductListing";
import { ProductDetails } from "./Pages/ProductDetails";
import NGOMAProductsPage from "./Pages/NGOMAProducts";
import { createContext } from "react";

import Login from "./Pages/Login";
import Register from "./Pages/Register";
import CartPage from "./Pages/Cart";
import Verify from "./Pages/Verify";
import ForgotPassword from "./Pages/ForgotPassword";
import Checkout from "./Pages/Checkout";
import MyAccount from "./Pages/MyAccount";
import MyList from "./Pages/MyList";
import Orders from "./Pages/Orders";
import AboutUs from "./Pages/About";
import FAQ from "./Pages/FAQ";
import Career from "./Pages/Career";
import ReturnRefundPolicy from "./Pages/ReturnRefundPolicy";
import OrderTracking from "./Pages/OrderTracking";
import ShippingInfo from "./Pages/ShippingInfo";
import DownloadApp from "./Pages/DownloadApp";
import ReportSuspiciousActivity from "./Pages/ReportSuspiciousActivity";
import Investors from "./Pages/Investors";
import SupportCenter from "./Pages/SupportCenter";
import Sitemap from "./Pages/Sitemap";
import HowToOrder from "./Pages/HowToOrder";
import HowToTrack from "./Pages/HowToTrack";
import PartnerWithUs from "./Pages/PartnerWithUs";
import BecomeVendor from "./Pages/BecomeVendor";
import VendorDashboard from "./Pages/VendorDashboard";
import VendorProducts from "./Pages/VendorDashboard/Products";
import VendorEarnings from "./Pages/VendorDashboard/Earnings";
import VendorShopPage from "./Pages/VendorShop";
import VendorSetupAccount from "./Pages/VendorSetupAccount";
import VendorVerifyEmail from "./Pages/VendorVerifyEmail";
import DeleteAccount from "./Pages/DeleteAccount";
import TermsOfUse from "./Pages/TermsOfUse";
import PrivacyPolicy from "./Pages/PrivacyPolicy";
import ConsumerHealthData from "./Pages/ConsumerHealthData";
import PrivacyChoices from "./Pages/PrivacyChoices";

import toast, { Toaster } from 'react-hot-toast';
import { fetchDataFromApi, postData } from "./utils/api";
import { trackPageView } from "./utils/analytics";
import Address from "./Pages/MyAccount/address";
import { OrderSuccess } from "./Pages/Orders/success";
import { OrderFailed } from "./Pages/Orders/failed";
import SearchPage from "./Pages/Search";
import BlogDetail from "./Pages/BlogDetail";
import ScrollToTop from "./components/ScrollToTop";


const MyContext = createContext();

function App() {
  const [openProductDetailsModal, setOpenProductDetailsModal] = useState({
    open: false,
    item: {}
  });
  const [isLogin, setIsLogin] = useState(false);
  const [userData, setUserData] = useState(null);
  const [catData, setCatData] = useState([]);
  const [cartData, setCartData] = useState([]);
  const [myListData, setMyListData] = useState([]);

  const [openCartPanel, setOpenCartPanel] = useState(false);
  const [openAddressPanel, setOpenAddressPanel] = useState(false);

  const [addressMode, setAddressMode] = useState("add");
  const [addressId, setAddressId] = useState("");
  const [searchData, setSearchData] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [openFilter, setOpenFilter] = useState(false);
  const [isFilterBtnShow, setisFilterBtnShow] = useState(false);

  const [openSearchPanel, setOpenSearchPanel] = useState(false);

  const handleOpenProductDetailsModal = (status, item) => {
    setOpenProductDetailsModal({
      open: status,
      item: item
    });
  }

  const handleCloseProductDetailsModal = () => {
    setOpenProductDetailsModal({
      open: false,
      item: {}
    });
  };

  const toggleCartPanel = (newOpen) => () => {
    setOpenCartPanel(newOpen);
  };

  const toggleAddressPanel = (newOpen) => () => {
    if (newOpen == false) {
      setAddressMode("add");
    }

    setOpenAddressPanel(newOpen);
  };




  // Initialize EmailJS
  useEffect(() => {
    emailjs.init('BEDoJ4iqpx2e53MtC');
    console.log('✅ EmailJS initialized');
  }, []);

  // Analytics - Track page views
  useEffect(() => {
    // Track initial page load
    trackPageView(window.location.pathname, document.title);
    
    // Track route changes using History API
    const handleRouteChange = () => {
      trackPageView(window.location.pathname, document.title);
    };
    
    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);
    
    // Override pushState and replaceState to track SPA navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      setTimeout(() => trackPageView(window.location.pathname, document.title), 100);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      setTimeout(() => trackPageView(window.location.pathname, document.title), 100);
    };
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  // Check and validate token on initial load
  useEffect(() => {
    localStorage.removeItem("userEmail");
    const token = localStorage.getItem('accessToken');

    if (token !== undefined && token !== null && token !== "") {
      // Token exists, validate it by fetching user details
      validateAndSetUser();
    } else {
      setIsLogin(false);
      setUserData(null);
      // Load guest cart when not logged in
      const guestCart = getGuestCart();
      setCartData(guestCart);
    }
  }, []); // Run only on mount

  // Function to validate token and set user state
  const validateAndSetUser = async () => {
    try {
      const res = await fetchDataFromApi(`/api/user/user-details`);
      
      // Check for various error conditions
      if (res?.error === true || 
          res?.response?.data?.error === true || 
          res?.response?.status === 401 ||
          res?.response?.status === 403 ||
          res?.message === "Authentication token required" ||
          res?.message === "Invalid token" ||
          res?.message === "Token expired" ||
          res?.response?.data?.message === "You have not login" ||
          res?.response?.data?.message === "Authentication token required" ||
          res?.response?.data?.message === "Invalid token" ||
          res?.response?.data?.message === "Token expired") {
        
        // Token is invalid - clear everything and reset state
        console.log('🔐 Token invalid or expired, clearing session...');
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setIsLogin(false);
        setUserData(null);
        setCartData([]);
        setMyListData([]);
        return;
      }
      
      // Token is valid - set user data and load cart/wishlist
      if (res?.data) {
        setUserData(res.data);
        setIsLogin(true);
        
        // Check if there's a guest cart to merge
        const guestCart = getGuestCart();
        if (guestCart.length > 0) {
          // Merge guest cart with server cart
          await mergeGuestCartAfterLogin();
        } else {
          getCartItems();
        }
        getMyListData();
      } else {
        // No user data returned - something is wrong
        console.log('🔐 No user data returned, clearing session...');
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setIsLogin(false);
        setUserData(null);
        // Load guest cart
        const guestCart = getGuestCart();
        setCartData(guestCart);
      }
    } catch (error) {
      console.error('🔐 Error validating token:', error);
      // On any error, clear the session to prevent stuck state
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setIsLogin(false);
      setUserData(null);
      setCartData([]);
      setMyListData([]);
    }
  };


  const getUserDetails = async () => {
    try {
      const res = await fetchDataFromApi(`/api/user/user-details`);
      
      // Check for authentication errors
      if (res?.error === true || 
          res?.response?.data?.error === true || 
          res?.response?.status === 401 ||
          res?.response?.status === 403 ||
          res?.message === "Authentication token required" ||
          res?.message === "Invalid token" ||
          res?.message === "Token expired" ||
          res?.response?.data?.message === "You have not login" ||
          res?.response?.data?.message === "Authentication token required" ||
          res?.response?.data?.message === "Invalid token" ||
          res?.response?.data?.message === "Token expired") {
        
        console.log('🔐 Session invalid, clearing...');
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        alertBox("error", "Your session has expired. Please login again.");
        setIsLogin(false);
        setUserData(null);
        setCartData([]);
        setMyListData([]);
        return null;
      }
      
      if (res?.data) {
        setUserData(res.data);
        return res.data;
      }
      return null;
    } catch (error) {
      console.error('🔐 Error getting user details:', error);
      // Clear session on error to prevent stuck state
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setIsLogin(false);
      setUserData(null);
      return null;
    }
  }



  useEffect(() => {
    fetchDataFromApi("/api/category").then((res) => {
      if (res?.error === false) {
        setCatData(res?.data);
      }
    })

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };

  }, []);

  const alertBox = (type, msg) => {
    if (type === "success") {
      toast.success(msg)
    }
    if (type === "error") {
      toast.error(msg)
    }
  }



  // Guest cart functions for localStorage
  const getGuestCart = () => {
    try {
      const guestCart = localStorage.getItem('guestCart');
      return guestCart ? JSON.parse(guestCart) : [];
    } catch (error) {
      console.error('Error reading guest cart:', error);
      return [];
    }
  };

  const saveGuestCart = (cart) => {
    try {
      localStorage.setItem('guestCart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving guest cart:', error);
    }
  };

  const clearGuestCart = () => {
    localStorage.removeItem('guestCart');
  };

  // Add to guest cart (localStorage)
  const addToGuestCart = (product, quantity) => {
    const guestCart = getGuestCart();
    
    // Check if product already in cart
    const existingIndex = guestCart.findIndex(item => 
      item.productId === product?._id &&
      item.size === product?.size &&
      item.weight === product?.weight &&
      item.ram === product?.ram &&
      JSON.stringify(item.variation) === JSON.stringify(product?.variation)
    );

    const cartItem = {
      _id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productTitle: product?.name,
      image: product?.image,
      rating: product?.rating,
      price: product?.price,
      oldPrice: product?.oldPrice,
      discount: product?.discount,
      quantity: quantity,
      subTotal: parseFloat(product?.price || 0) * quantity,
      productId: product?._id,
      countInStock: product?.countInStock,
      brand: product?.brand,
      size: product?.size,
      weight: product?.weight,
      ram: product?.ram,
      variation: product?.variation,
      productType: product?.productType,
      variationId: product?.variationId
    };

    if (existingIndex !== -1) {
      // Update existing item quantity
      guestCart[existingIndex].quantity += quantity;
      guestCart[existingIndex].subTotal = parseFloat(guestCart[existingIndex].price || 0) * guestCart[existingIndex].quantity;
    } else {
      // Add new item
      guestCart.push(cartItem);
    }

    saveGuestCart(guestCart);
    setCartData(guestCart);
    alertBox("success", "Product added to cart");
    return true;
  };

  // Update guest cart quantity
  const updateGuestCartQty = (itemId, newQty) => {
    const guestCart = getGuestCart();
    const index = guestCart.findIndex(item => item._id === itemId);
    
    if (index !== -1) {
      guestCart[index].quantity = newQty;
      guestCart[index].subTotal = parseFloat(guestCart[index].price || 0) * newQty;
      saveGuestCart(guestCart);
      setCartData(guestCart);
      alertBox("success", "Cart updated");
    }
  };

  // Remove from guest cart
  const removeFromGuestCart = (itemId) => {
    const guestCart = getGuestCart();
    const updatedCart = guestCart.filter(item => item._id !== itemId);
    saveGuestCart(updatedCart);
    setCartData(updatedCart);
    alertBox("success", "Product removed from cart");
  };

  // Merge guest cart with server cart after login
  const mergeGuestCartWithServer = async () => {
    const guestCart = getGuestCart();
    
    if (guestCart.length === 0) return;

    console.log('🛒 Merging guest cart with server cart...');
    
    for (const item of guestCart) {
      try {
        const data = {
          productTitle: item.productTitle,
          image: item.image,
          rating: item.rating,
          price: item.price,
          oldPrice: item.oldPrice,
          discount: item.discount,
          quantity: item.quantity,
          subTotal: item.subTotal,
          productId: item.productId,
          countInStock: item.countInStock,
          brand: item.brand,
          size: item.size,
          weight: item.weight,
          ram: item.ram,
          variation: item.variation,
          productType: item.productType,
          variationId: item.variationId
        };
        
        await postData("/api/cart/add", data);
      } catch (error) {
        console.error('Error merging cart item:', error);
      }
    }
    
    // Clear guest cart after merge
    clearGuestCart();
    // Refresh cart from server
    fetchDataFromApi(`/api/cart/get`).then((res) => {
      if (res?.error === false) {
        setCartData(res?.data);
      }
    });
    alertBox("success", "Your cart items have been saved to your account");
  };

  // Internal merge function for use after login validation
  const mergeGuestCartAfterLogin = async () => {
    const guestCart = getGuestCart();
    
    if (guestCart.length === 0) {
      // No guest cart, just load server cart
      fetchDataFromApi(`/api/cart/get`).then((res) => {
        if (res?.error === false) {
          setCartData(res?.data);
        }
      });
      return;
    }

    console.log('🛒 Merging guest cart after login...');
    
    for (const item of guestCart) {
      try {
        const data = {
          productTitle: item.productTitle,
          image: item.image,
          rating: item.rating,
          price: item.price,
          oldPrice: item.oldPrice,
          discount: item.discount,
          quantity: item.quantity,
          subTotal: item.subTotal,
          productId: item.productId,
          countInStock: item.countInStock,
          brand: item.brand,
          size: item.size,
          weight: item.weight,
          ram: item.ram,
          variation: item.variation,
          productType: item.productType,
          variationId: item.variationId
        };
        
        await postData("/api/cart/add", data);
      } catch (error) {
        console.error('Error merging cart item:', error);
      }
    }
    
    // Clear guest cart after merge
    clearGuestCart();
    // Refresh cart from server
    fetchDataFromApi(`/api/cart/get`).then((res) => {
      if (res?.error === false) {
        setCartData(res?.data);
      }
    });
  };

  const addToCart = (product, userId, quantity) => {
    // If user is not logged in, use guest cart
    if (userId === undefined || !isLogin) {
      return addToGuestCart(product, quantity);
    }

    const data = {
      productTitle: product?.name || product?.productTitle,
      image: product?.image,
      rating: product?.rating,
      price: product?.price,
      oldPrice: product?.oldPrice,
      discount: product?.discount,
      quantity: quantity,
      subTotal: parseFloat(product?.price || 0) * quantity,
      productId: product?.productId || product?._id,
      countInStock: product?.countInStock,
      brand: product?.brand,
      // Old fields (backward compatibility)
      size: product?.size,
      weight: product?.weight,
      ram: product?.ram,
      // NEW: Variation fields for variable products
      productType: product?.productType || 'simple',
      variationId: product?.variationId || null,
      variation: product?.variation || null
    }

    postData("/api/cart/add", data).then((res) => {
      if (res?.error === false) {
        alertBox("success", res?.message);
        getCartItems();
      } else {
        alertBox("error", res?.message);
      }
    })
  }



  // Function to clear session (can be called when auth errors occur)
  const clearSession = () => {
    console.log('🔐 Clearing session...');
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userEmail");
    setIsLogin(false);
    setUserData(null);
    setCartData([]);
    setMyListData([]);
  };

  const getCartItems = () => {
    // If not logged in, get guest cart from localStorage
    if (!isLogin) {
      const guestCart = getGuestCart();
      setCartData(guestCart);
      return;
    }
    
    // If logged in, get cart from server
    fetchDataFromApi(`/api/cart/get`).then((res) => {
      if (res?.error === false) {
        setCartData(res?.data);
      } else if (res?.isAuthError) {
        // Auth error - clear session and load guest cart
        clearSession();
        const guestCart = getGuestCart();
        setCartData(guestCart);
      }
    })
  }



  const getMyListData = () => {
    fetchDataFromApi("/api/myList").then((res) => {
      if (res?.error === false) {
        setMyListData(res?.data)
      } else if (res?.isAuthError) {
        // Auth error - clear session
        clearSession();
      }
    })
  }

  const values = {
    openProductDetailsModal,
    setOpenProductDetailsModal,
    handleOpenProductDetailsModal,
    handleCloseProductDetailsModal,
    setOpenCartPanel,
    toggleCartPanel,
    openCartPanel,
    setOpenAddressPanel,
    toggleAddressPanel,
    openAddressPanel,
    isLogin,
    setIsLogin,
    alertBox,
    setUserData,
    userData,
    setCatData,
    catData,
    addToCart,
    cartData,
    setCartData,
    getCartItems,
    myListData,
    setMyListData,
    getMyListData,
    getUserDetails,
    clearSession,
    // Guest cart functions
    updateGuestCartQty,
    removeFromGuestCart,
    mergeGuestCartWithServer,
    setAddressMode,
    addressMode,
    addressId,
    setAddressId,
    setSearchData,
    searchData,
    windowWidth,
    setOpenFilter,
    openFilter,
    setisFilterBtnShow,
    isFilterBtnShow,
    setOpenSearchPanel,
    openSearchPanel
  };

  return (
    <>
      <BrowserRouter>
        <MyContext.Provider value={values}>
          <ScrollToTop />
          <Header />
          <Routes>
            <Route path={"/"} exact={true} element={<Home />} />
            <Route
              path={"/products"}
              element={<ProductListing />}
            />
            <Route
              path={"/ngoma"}
              exact={true}
              element={<NGOMAProductsPage />}
            />
            <Route
              path={"/ngoma-products"}
              exact={true}
              element={<NGOMAProductsPage />}
            />
            <Route
              path={"/product/:id"}
              exact={true}
              element={<ProductDetails />}
            />
            <Route path={"/login"} exact={true} element={<Login />} />
            <Route path={"/register"} exact={true} element={<Register />} />
            <Route path={"/cart"} exact={true} element={<CartPage />} />
            <Route path={"/verify"} exact={true} element={<Verify />} />
            <Route path={"/forgot-password"} exact={true} element={<ForgotPassword />} />
            <Route path={"/checkout"} exact={true} element={<Checkout />} />
            <Route path={"/my-account"} exact={true} element={<MyAccount />} />
            <Route path={"/my-list"} exact={true} element={<MyList />} />
            <Route path={"/my-orders"} exact={true} element={<Orders />} />
            <Route path={"/about"} exact={true} element={<AboutUs />} />
            <Route path={"/faq"} exact={true} element={<FAQ />} />
            <Route path={"/careers"} exact={true} element={<Career />} />
            <Route path={"/return-refund-policy"} exact={true} element={<ReturnRefundPolicy />} />
            <Route path={"/order-tracking"} exact={true} element={<OrderTracking />} />
            <Route path={"/shipping-info"} exact={true} element={<ShippingInfo />} />
            <Route path={"/download-app"} exact={true} element={<DownloadApp />} />
            <Route path={"/report-suspicious-activity"} exact={true} element={<ReportSuspiciousActivity />} />
            <Route path={"/investors"} exact={true} element={<Investors />} />
            <Route path={"/help-center"} exact={true} element={<SupportCenter />} />
            <Route path={"/support-center"} exact={true} element={<SupportCenter />} />
            <Route path={"/contact"} exact={true} element={<SupportCenter />} />
            <Route path={"/sitemap"} exact={true} element={<Sitemap />} />
            <Route path={"/how-to-order"} exact={true} element={<HowToOrder />} />
            <Route path={"/how-to-track"} exact={true} element={<HowToTrack />} />
            <Route path={"/partner-with-us"} exact={true} element={<PartnerWithUs />} />
            <Route path={"/become-vendor"} exact={true} element={<BecomeVendor />} />
            <Route path={"/vendor/verify-email"} exact={true} element={<VendorVerifyEmail />} />
            <Route path={"/vendor/setup-account"} exact={true} element={<VendorSetupAccount />} />
            <Route path={"/vendor/dashboard"} exact={true} element={<VendorDashboard />} />
            <Route path={"/vendor/products"} exact={true} element={<VendorProducts />} />
            <Route path={"/vendor/earnings"} exact={true} element={<VendorEarnings />} />
            <Route path={"/vendor/:shopSlug"} exact={true} element={<VendorShopPage />} />
            <Route path={"/delete-account"} exact={true} element={<DeleteAccount />} />
            <Route path={"/terms"} exact={true} element={<TermsOfUse />} />
            <Route path={"/terms-of-use"} exact={true} element={<TermsOfUse />} />
            <Route path={"/privacy-policy"} exact={true} element={<PrivacyPolicy />} />
            <Route path={"/consumer-health-data-privacy"} exact={true} element={<ConsumerHealthData />} />
            <Route path={"/privacy-choices"} exact={true} element={<PrivacyChoices />} />
            {/* Order result pages - removed exact prop for React Router v7 compatibility */}
            <Route path={"/order/success"} element={<OrderSuccess />} />
            <Route path={"/order/failed"} element={<OrderFailed />} />
            <Route path={"/address"} exact={true} element={<Address />} />
            <Route path={"/search"} exact={true} element={<SearchPage />} />
            <Route path={"/blog/:id"} exact={true} element={<BlogDetail />} />
            {/* Catch-all route for 404 - must be last */}
            <Route path="*" element={
              <section className='w-full p-10 py-8 lg:py-20 flex items-center justify-center flex-col gap-2'>
                <h3 className='mb-0 text-[20px] sm:text-[25px]'>Page Not Found</h3>
                <p className='mt-0 text-center'>The page you're looking for doesn't exist.</p>
                <Link to="/">
                  <Button className="btn-org btn-border">Back to home</Button>
                </Link>
              </section>
            } />
          </Routes>
          <Footer />
        </MyContext.Provider>
      </BrowserRouter>





      <Toaster />


    </>
  );
}

export default App;

export { MyContext };
