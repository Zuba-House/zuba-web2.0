import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, Link } from "react-router-dom";
import Button from "@mui/material/Button";
import emailjs from '@emailjs/browser';
import "./App.css";
import "./responsive.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./Pages/Home";
import ProductListing from "./Pages/ProductListing";
import { ProductDetails } from "./Pages/ProductDetails";
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
import DeleteAccount from "./Pages/DeleteAccount";
import TermsOfUse from "./Pages/TermsOfUse";
import PrivacyPolicy from "./Pages/PrivacyPolicy";
import ConsumerHealthData from "./Pages/ConsumerHealthData";
import PrivacyChoices from "./Pages/PrivacyChoices";

import toast, { Toaster } from 'react-hot-toast';
import { fetchDataFromApi, postData } from "./utils/api";
import Address from "./Pages/MyAccount/address";
import { OrderSuccess } from "./Pages/Orders/success";
import { OrderFailed } from "./Pages/Orders/failed";
import SearchPage from "./Pages/Search";
import BlogDetail from "./Pages/BlogDetail";


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

  useEffect(() => {
    localStorage.removeItem("userEmail")
    const token = localStorage.getItem('accessToken');

    if (token !== undefined && token !== null && token !== "") {
      setIsLogin(true);

      getCartItems();
      getMyListData();
      getUserDetails();

    } else {
      setIsLogin(false);
    }


  }, [isLogin])


  const getUserDetails = () => {
    fetchDataFromApi(`/api/user/user-details`).then((res) => {
      setUserData(res.data);
      if (res?.response?.data?.error === true) {
        if (res?.response?.data?.message === "You have not login") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          alertBox("error", "Your session is closed please login again");


          //window.location.href = "/login"

          setIsLogin(false);
        }
      }
    })
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



  const addToCart = (product, userId, quantity) => {

    if (userId === undefined) {
      alertBox("error", "you are not login please login first");
      return false;
    }

    const data = {
      productTitle: product?.name,
      image: product?.image,
      rating: product?.rating,
      price: product?.price,
      oldPrice: product?.oldPrice,
      discount: product?.discount,
      quantity: quantity,
      subTotal: parseInt(product?.price * quantity),
      productId: product?._id,
      countInStock: product?.countInStock,
      brand: product?.brand,
      size: product?.size,
      weight: product?.weight,
      ram: product?.ram
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



  const getCartItems = () => {
    fetchDataFromApi(`/api/cart/get`).then((res) => {
      if (res?.error === false) {
        setCartData(res?.data);
      }
    })
  }



  const getMyListData = () => {
    fetchDataFromApi("/api/myList").then((res) => {
      if (res?.error === false) {
        setMyListData(res?.data)
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
          <Header />
          <Routes>
            <Route path={"/"} exact={true} element={<Home />} />
            <Route
              path={"/products"}
              exact={true}
              element={<ProductListing />}
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
