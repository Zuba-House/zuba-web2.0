import { Button } from "@mui/material";
import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { CgLogIn } from "react-icons/cg";
import { FaRegUser } from "react-icons/fa6";
import OtpBox from "../../Components/OtpBox";
import { useContext } from "react";
import { MyContext } from "../../App";
import { useNavigate } from "react-router-dom";
import { fetchDataFromApi, postData } from "../../utils/api";
import CircularProgress from '@mui/material/CircularProgress';
import { useEffect } from "react";

const VerifyAccount = () => {

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const context = useContext(MyContext);
  const history = useNavigate();

  useEffect(() => {
    fetchDataFromApi("/api/logo").then((res) => {
      localStorage.setItem('logo', res?.logo[0]?.logo)
    })
  }, [])

  // Resend OTP cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOtpChange = (value) => {
    setOtp(value);
  };


  const verityOTP = (e) => {
    e.preventDefault();


    if (otp !== "") {
      setIsLoading(true)
      const actionType = localStorage.getItem("actionType");
      if (actionType !== "forgot-password") {

        postData("/api/user/verifyEmail", {
          email: localStorage.getItem("userEmail"),
          otp: otp
        }).then((res) => {
          if (res?.error === false) {
            context.alertBox("success", res?.message);
            localStorage.removeItem("userEmail")
            setIsLoading(false)
            history("/login")
          } else {
            context.alertBox("error", res?.message || "Invalid OTP. Please try again.");
            setIsLoading(false)
          }
        }).catch((error) => {
          console.error('Verify OTP error:', error);
          context.alertBox("error", "Failed to verify OTP. Please try again.");
          setIsLoading(false)
        })
      }

      else {
        postData("/api/user/verify-forgot-password-otp", {
          email: localStorage.getItem("userEmail"),
          otp: otp
        }).then((res) => {
          if (res?.error === false) {
            context.alertBox("success", res?.message);
            history("/change-password")
          } else {
            context.alertBox("error", res?.message || "Invalid OTP. Please try again.");
            setIsLoading(false)
          }
        }).catch((error) => {
          console.error('Verify OTP error:', error);
          context.alertBox("error", "Failed to verify OTP. Please try again.");
          setIsLoading(false)
        })
      }
    }
    else {
      context.alertBox("error", "Please enter OTP");
    }

  }

  const handleResendOTP = () => {
    const userEmail = localStorage.getItem("userEmail");
    const actionType = localStorage.getItem("actionType");

    if (!userEmail) {
      context.alertBox("error", "Email not found. Please register again.");
      return;
    }

    if (resendCooldown > 0) {
      context.alertBox("error", `Please wait ${resendCooldown} seconds before resending.`);
      return;
    }

    setIsResending(true);

    // Only resend for email verification (not forgot password)
    if (actionType === "forgot-password") {
      // For forgot password, use the forgot-password endpoint
      postData("/api/user/forgot-password", {
        email: userEmail
      }).then((res) => {
        if (res?.error === false) {
          context.alertBox("success", "OTP has been resent to your email.");
          setResendCooldown(60); // 60 second cooldown
        } else {
          context.alertBox("error", res?.message || "Failed to resend OTP.");
        }
        setIsResending(false);
      }).catch((error) => {
        console.error('Resend OTP error:', error);
        context.alertBox("error", "Failed to resend OTP. Please try again.");
        setIsResending(false);
      });
    } else {
      // For email verification, use the resend-otp endpoint
      postData("/api/user/resend-otp", {
        email: userEmail
      }).then((res) => {
        if (res?.error === false) {
          context.alertBox("success", res?.message || "OTP has been resent to your email.");
          setResendCooldown(60); // 60 second cooldown
          
          // If email failed but OTP is in response, show it
          if (res?.data?.otp && !res?.data?.emailSent) {
            console.log('🔑 OTP Code (email failed):', res.data.otp);
            context.alertBox("info", `OTP Code: ${res.data.otp} (Email delivery failed - check server console)`);
          }
        } else {
          context.alertBox("error", res?.message || "Failed to resend OTP.");
        }
        setIsResending(false);
      }).catch((error) => {
        console.error('Resend OTP error:', error);
        context.alertBox("error", "Failed to resend OTP. Please try again.");
        setIsResending(false);
      });
    }
  }


  return (
    <section className="bg-white w-full h-[100vh]">
      <header className="w-full static lg:fixed top-0 left-0  px-4 py-3 flex items-center justify-center sm:justify-between z-50">
        <Link to="/">
          <img
            src={localStorage.getItem('logo')}
            className="w-[200px]"
          />
        </Link>

        <div className="hidden sm:flex items-center gap-0">
          <NavLink to="/login" exact={true} activeClassName="isActive">
            <Button className="!rounded-full !text-[rgba(0,0,0,0.8)] !px-5 flex gap-1">
              <CgLogIn className="text-[18px]" /> Login
            </Button>
          </NavLink>

          <NavLink to="/sign-up" exact={true} activeClassName="isActive">
            <Button className="!rounded-full !text-[rgba(0,0,0,0.8)] !px-5 flex gap-1">
              <FaRegUser className="text-[15px]" /> Sign Up
            </Button>
          </NavLink>
        </div>
      </header>
      <img src="/patern.webp" className="w-full fixed top-0 left-0 opacity-5" />

      <div className="loginBox card w-full md:w-[600px] h-[auto] pb-20 mx-auto pt-5 lg:pt-20 relative z-50">
        <div className="text-center">
          <img src="/verify3.png" className="w-[100px] m-auto" />
        </div>

        <h1 className="text-center text-[18px] sm:text-[35px] font-[800] mt-4">
          Welcome Back!
          <br />
          Please Verify your Email
        </h1>

        <br />
        <p className="text-center text-[15px]">OTP send to  &nbsp;
          <span className="text-primary font-bold text-[12px] sm:text-[14px]">{localStorage.getItem("userEmail")}</span></p>

        <br />

        <form onSubmit={verityOTP}>
          <div className="text-center flex items-center justify-center flex-col">
            <OtpBox length={6} onChange={handleOtpChange} />
          </div>

          <br />

          <div className="w-[100%] px-3 sm:w-[300px] sm:px-0 m-auto">
            <Button type="submit" className="btn-blue w-full">

              {
                isLoading === true ? <CircularProgress color="inherit" />
                  :
                  'Verify OTP'
              }
            </Button>
          </div>

        </form>

        <br />

        <div className="w-[100%] px-3 sm:w-[300px] sm:px-0 m-auto text-center">
          <p className="text-[14px] text-gray-600 mb-2">
            Didn't receive the code?
          </p>
          <Button 
            onClick={handleResendOTP}
            disabled={isResending || resendCooldown > 0}
            className="!text-primary !font-[600] !text-[14px] hover:!underline"
            variant="text"
          >
            {isResending ? (
              <>
                <CircularProgress size={16} className="!mr-2" />
                Sending...
              </>
            ) : resendCooldown > 0 ? (
              `Resend OTP (${resendCooldown}s)`
            ) : (
              "Resend OTP"
            )}
          </Button>
        </div>

      </div>
    </section>
  );
};

export default VerifyAccount;
