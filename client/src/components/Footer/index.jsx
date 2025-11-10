import React, { useContext } from "react";
import { LiaShippingFastSolid } from "react-icons/lia";
import { PiKeyReturnLight } from "react-icons/pi";
import { BsWallet2 } from "react-icons/bs";
import { LiaGiftSolid } from "react-icons/lia";
import { BiSupport } from "react-icons/bi";
import { Link } from "react-router-dom";
import { IoChatboxOutline } from "react-icons/io5";

import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { FaFacebookF } from "react-icons/fa";
import { AiOutlineYoutube } from "react-icons/ai";
import { FaPinterestP } from "react-icons/fa";
import { FaInstagram } from "react-icons/fa";

import Drawer from "@mui/material/Drawer";
import CartPanel from "../CartPanel";
import { MyContext } from "../../App";


import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import { ProductZoom } from "../ProductZoom";
import { IoCloseSharp } from "react-icons/io5";
import { ProductDetailsComponent } from "../ProductDetails";
import AddAddress from "../../Pages/MyAccount/addAddress";


const Footer = () => {
  const context = useContext(MyContext);

  return (
    <>
      <footer className="py-6 bg-[#0b2735]">
        <div className="container">
          {/* ZeroX Intelligence: Made feature boxes responsive - wraps to 2 columns on tablet, stacks on mobile */}
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 lg:gap-2 py-3 lg:py-8 pb-0 lg:pb-8 px-2 sm:px-3 lg:px-5 scrollableBox footerBoxWrap">
            {/* ZeroX Intelligence: Added responsive width - full width on mobile, 45% on tablet, 15% on desktop */}
            <div className="col flex items-center justify-center flex-col group w-full sm:w-[45%] md:w-[30%] lg:w-[15%] mb-4 lg:mb-0">
              {/* ZeroX Intelligence: Made icon size responsive */}
              <LiaShippingFastSolid className="text-[30px] sm:text-[35px] lg:text-[40px] text-[#e5e2db] transition-all duration-300 group-hover:text-[#efb291] group-hover:-translate-y-1" />
              {/* ZeroX Intelligence: Made heading responsive */}
              <h3 className="text-[14px] sm:text-[15px] lg:text-[16px] font-[600] mt-2 lg:mt-3 text-[#e5e2db] text-center">Free Shipping</h3>
              {/* ZeroX Intelligence: Made description responsive and centered */}
              <p className="text-[11px] sm:text-[12px] font-[500] text-[#e5e2db] text-center">For all Orders Over $100</p>
            </div>

            {/* ZeroX Intelligence: Same responsive pattern for all feature boxes */}
            <div className="col flex items-center justify-center flex-col group w-full sm:w-[45%] md:w-[30%] lg:w-[15%] mb-4 lg:mb-0">
              <PiKeyReturnLight className="text-[30px] sm:text-[35px] lg:text-[40px] text-[#e5e2db] transition-all duration-300 group-hover:text-[#efb291] group-hover:-translate-y-1" />
              <h3 className="text-[14px] sm:text-[15px] lg:text-[16px] font-[600] mt-2 lg:mt-3 text-[#e5e2db] text-center">30 Days Returns</h3>
              <p className="text-[11px] sm:text-[12px] font-[500] text-[#e5e2db] text-center">For an Exchange Product</p>
            </div>

            <div className="col flex items-center justify-center flex-col group w-full sm:w-[45%] md:w-[30%] lg:w-[15%] mb-4 lg:mb-0">
              <BsWallet2 className="text-[30px] sm:text-[35px] lg:text-[40px] text-[#e5e2db] transition-all duration-300 group-hover:text-[#efb291] group-hover:-translate-y-1" />
              <h3 className="text-[14px] sm:text-[15px] lg:text-[16px] font-[600] mt-2 lg:mt-3 text-[#e5e2db] text-center">Secured Payment</h3>
              <p className="text-[11px] sm:text-[12px] font-[500] text-[#e5e2db] text-center">Payment Cards Accepted</p>
            </div>

            <div className="col flex items-center justify-center flex-col group w-full sm:w-[45%] md:w-[30%] lg:w-[15%] mb-4 lg:mb-0">
              <LiaGiftSolid className="text-[30px] sm:text-[35px] lg:text-[40px] text-[#e5e2db] transition-all duration-300 group-hover:text-[#efb291] group-hover:-translate-y-1" />
              <h3 className="text-[14px] sm:text-[15px] lg:text-[16px] font-[600] mt-2 lg:mt-3 text-[#e5e2db] text-center">Special Gifts</h3>
              <p className="text-[11px] sm:text-[12px] font-[500] text-[#e5e2db] text-center">Our First Product Order</p>
            </div>

            <div className="col flex items-center justify-center flex-col group w-full sm:w-[45%] md:w-[30%] lg:w-[15%] mb-4 lg:mb-0">
              <BiSupport className="text-[30px] sm:text-[35px] lg:text-[40px] text-[#e5e2db] transition-all duration-300 group-hover:text-[#efb291] group-hover:-translate-y-1" />
              <h3 className="text-[14px] sm:text-[15px] lg:text-[16px] font-[600] mt-2 lg:mt-3 text-[#e5e2db] text-center">Support 24/7</h3>
              <p className="text-[11px] sm:text-[12px] font-[500] text-[#e5e2db] text-center">Contact us Anytime</p>
            </div>
          </div>
          <br />

          <hr className="border-[rgba(229,226,219,0.2)]" />

          {/* ZeroX Intelligence: Main footer sections - already responsive with flex-col on mobile */}
          <div className="footer flex px-3 lg:px-0 flex-col lg:flex-row py-8 gap-6 lg:gap-0">
            {/* ZeroX Intelligence: Removed right border on mobile, added bottom padding for separation */}
            <div className="part1 w-full lg:w-[25%] lg:border-r border-[rgba(229,226,219,0.2)] pb-6 lg:pb-0 border-b lg:border-b-0 lg:pr-6">
              {/* ZeroX Intelligence: Made heading responsive */}
              <h2 className="text-[16px] sm:text-[17px] lg:text-[18px] font-[600] mb-3 lg:mb-4 text-[#e5e2db]">Contact us</h2>
              {/* ZeroX Intelligence: Made text responsive */}
              <p className="text-[12px] sm:text-[13px] font-[400] pb-3 lg:pb-4 text-[#e5e2db]">
                Zuba House
                <br />
                
              </p>

              <Link
                className="link text-[12px] sm:text-[13px] text-[#e5e2db] hover:text-[#efb291] break-all"
                to="mailto:info@zubahouse.com"
              >
                info@zubahouse.com
              </Link>

              {/* ZeroX Intelligence: Made phone number responsive */}
              <span className="text-[18px] sm:text-[20px] lg:text-[22px] font-[600] block w-full mt-3 mb-4 lg:mb-5 text-[#efb291]">
                (+1) 437-557-7487
              </span>

              {/* ZeroX Intelligence: Made chat section responsive */}
              <div className="flex items-center gap-2">
                <IoChatboxOutline className="text-[32px] sm:text-[36px] lg:text-[40px] text-[#efb291]" />
                <span className="text-[14px] sm:text-[15px] lg:text-[16px] font-[600] text-[#e5e2db]">
                  Online Chat
                  <br />
                  Get Expert Help
                </span>
              </div>
            </div>

            {/* ZeroX Intelligence: Made links section responsive - stacks columns on mobile */}
            <div className="part2 w-full lg:w-[40%] flex flex-col sm:flex-row pl-0 lg:pl-8 gap-6 sm:gap-4 pb-6 lg:pb-0 border-b lg:border-b-0">
              {/* ZeroX Intelligence: Made columns full width on mobile, 50% on tablet+ */}
              <div className="part2_col1 w-full sm:w-[50%]">
                <h2 className="text-[16px] sm:text-[17px] lg:text-[18px] font-[600] mb-3 lg:mb-4 text-[#e5e2db]">Products</h2>

                <ul className="list">
                  {/* ZeroX Intelligence: Made list items responsive */}
                  <li className="list-none text-[13px] sm:text-[14px] w-full mb-2">
                    <Link to="/" className="link text-[#e5e2db] hover:text-[#efb291]">
                      Prices drop
                    </Link>
                  </li>
                  <li className="list-none text-[13px] sm:text-[14px] w-full mb-2">
                    <Link to="/" className="link text-[#e5e2db] hover:text-[#efb291]">
                      New products
                    </Link>
                  </li>
                  <li className="list-none text-[13px] sm:text-[14px] w-full mb-2">
                    <Link to="/" className="link text-[#e5e2db] hover:text-[#efb291]">
                      Best sales
                    </Link>
                  </li>
                  <li className="list-none text-[13px] sm:text-[14px] w-full mb-2">
                    <Link to="/" className="link text-[#e5e2db] hover:text-[#efb291]">
                      Contact us
                    </Link>
                  </li>
                  <li className="list-none text-[13px] sm:text-[14px] w-full mb-2">
                    <Link to="/" className="link text-[#e5e2db] hover:text-[#efb291]">
                      Sitemap
                    </Link>
                  </li>
                  <li className="list-none text-[13px] sm:text-[14px] w-full mb-2">
                    <Link to="/" className="link text-[#e5e2db] hover:text-[#efb291]">
                      Stores
                    </Link>
                  </li>
                </ul>
              </div>

              {/* ZeroX Intelligence: Same responsive pattern for second column */}
              <div className="part2_col2 w-full sm:w-[50%]">
                <h2 className="text-[16px] sm:text-[17px] lg:text-[18px] font-[600] mb-3 lg:mb-4 text-[#e5e2db]">Our company</h2>

                <ul className="list">
                  <li className="list-none text-[13px] sm:text-[14px] w-full mb-2">
                    <Link to="/" className="link text-[#e5e2db] hover:text-[#efb291]">
                      Delivery
                    </Link>
                  </li>
                  <li className="list-none text-[13px] sm:text-[14px] w-full mb-2">
                    <Link to="/" className="link text-[#e5e2db] hover:text-[#efb291]">
                      Legal Notice
                    </Link>
                  </li>
                  <li className="list-none text-[13px] sm:text-[14px] w-full mb-2">
                    <Link to="/" className="link text-[#e5e2db] hover:text-[#efb291]">
                      Terms and conditions of use
                    </Link>
                  </li>
                  <li className="list-none text-[13px] sm:text-[14px] w-full mb-2">
                    <Link to="/" className="link text-[#e5e2db] hover:text-[#efb291]">
                      About us
                    </Link>
                  </li>
                  <li className="list-none text-[13px] sm:text-[14px] w-full mb-2">
                    <Link to="/" className="link text-[#e5e2db] hover:text-[#efb291]">
                      Secure payment
                    </Link>
                  </li>
                  <li className="list-none text-[13px] sm:text-[14px] w-full mb-2">
                    <Link to="/" className="link text-[#e5e2db] hover:text-[#efb291]">
                      Login
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* ZeroX Intelligence: Newsletter section - removed excess padding on mobile */}
            <div className="part2 w-full lg:w-[35%] flex pl-0 lg:pl-8 flex-col pr-0 lg:pr-8">
              {/* ZeroX Intelligence: Made newsletter heading responsive */}
              <h2 className="text-[16px] sm:text-[17px] lg:text-[18px] font-[600] mb-2 lg:mb-4 text-[#e5e2db]">
                Subscribe to newsletter
              </h2>
              {/* ZeroX Intelligence: Made description responsive */}
              <p className="text-[12px] sm:text-[13px] text-[#e5e2db]">
                Subscribe to our latest newsletter to get news about special
                discounts.
              </p>

              <form className="mt-4 lg:mt-5">
                {/* ZeroX Intelligence: Made input responsive */}
                <input
                  type="text"
                  className="w-full h-[42px] sm:h-[45px] border outline-none pl-3 pr-3 sm:pl-4 sm:pr-4 rounded-sm mb-3 lg:mb-4 focus:border-[rgba(229,226,219,0.5)] text-[14px]"
                  placeholder="Your Email Address"
                />

                {/* ZeroX Intelligence: Made button full width on mobile */}
                <Button className="btn-org w-full sm:w-auto">SUBSCRIBE</Button>

                {/* ZeroX Intelligence: Made checkbox label responsive */}
                <FormControlLabel
                  className="mt-3 lg:mt-0 block w-full"
                  control={<Checkbox sx={{
                    color: '#e5e2db',
                    '&.Mui-checked': {
                      color: '#efb291',
                    },
                  }} />}
                  label=" I agree to the terms and conditions and the privacy policy"
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      color: '#e5e2db',
                      fontSize: { xs: '12px', sm: '14px' }
                    }
                  }}
                />
              </form>
            </div>
          </div>
        </div>
      </footer>

      {/* ZeroX Intelligence: Bottom strip - made fully responsive */}
      <div className="bottomStrip border-t border-[rgba(0,0,0,0.1)] pt-3 pb-[100px] lg:pb-3 bg-white">
        <div className="container flex items-center justify-between flex-col lg:flex-row gap-4 lg:gap-0 px-3 lg:px-0">
          {/* ZeroX Intelligence: Social icons - maintained on all screens */}
          <ul className="flex items-center gap-2 order-1 lg:order-1">
            <li className="list-none">
              <Link
                to="/"
                target="_blank"
                className="w-[35px] h-[35px] rounded-full border border-[rgba(0,0,0,0.1)] flex items-center justify-center group hover:bg-primary transition-all"
              >
                <FaFacebookF className="text-[17px] group-hover:text-white" />
              </Link>
            </li>

            <li className="list-none">
              <Link
                to="/"
                target="_blank"
                className="w-[35px] h-[35px] rounded-full border border-[rgba(0,0,0,0.1)] flex items-center justify-center group hover:bg-primary transition-all"
              >
                <AiOutlineYoutube className="text-[21px] group-hover:text-white" />
              </Link>
            </li>

            <li className="list-none">
              <Link
                to="/"
                target="_blank"
                className="w-[35px] h-[35px] rounded-full border border-[rgba(0,0,0,0.1)] flex items-center justify-center group hover:bg-primary transition-all"
              >
                <FaPinterestP className="text-[17px] group-hover:text-white" />
              </Link>
            </li>

            <li className="list-none">
              <Link
                to="/"
                target="_blank"
                className="w-[35px] h-[35px] rounded-full border border-[rgba(0,0,0,0.1)] flex items-center justify-center group hover:bg-primary transition-all"
              >
                <FaInstagram className="text-[17px] group-hover:text-white" />
              </Link>
            </li>
          </ul>

          {/* ZeroX Intelligence: Copyright text - made responsive and reordered */}
          <p className="text-[11px] sm:text-[12px] lg:text-[13px] text-center mb-0 order-3 lg:order-2 px-2">
            © 2024－2025 Zuba House Inc. All Rights Reserved. Secured by ZeroX Intelligence
          </p>

          {/* ZeroX Intelligence: Payment icons - made responsive and scrollable if needed */}
          <div className="flex items-center gap-1 flex-wrap justify-center order-2 lg:order-3">
            <img src="/carte_bleue.png" alt="Carte Bleue" className="h-[20px] sm:h-[24px] w-auto" />
            <img src="/visa.png" alt="Visa" className="h-[20px] sm:h-[24px] w-auto" />
            <img src="/master_card.png" alt="MasterCard" className="h-[20px] sm:h-[24px] w-auto" />
            <img src="/american_express.png" alt="American Express" className="h-[20px] sm:h-[24px] w-auto" />
          </div>
        </div>
      </div>






      {/* Cart Panel */}
      <Drawer
        open={context.openCartPanel}
        onClose={context.toggleCartPanel(false)}
        anchor={"right"}
        className="cartPanel"
      >
        <div className="flex items-center justify-between py-3 px-4 gap-3 border-b border-[rgba(0,0,0,0.1)] overflow-hidden">
          <h4>Shopping Cart ({context?.cartData?.length})</h4>
          <IoCloseSharp className="text-[20px] cursor-pointer" onClick={context.toggleCartPanel(false)} />
        </div>


        {

          context?.cartData?.length !== 0 ? <CartPanel data={context?.cartData} /> :
            <>
              <div className="flex items-center justify-center flex-col pt-[100px] gap-5">
                <img src="/empty-cart.png" className="w-[150px]" />
                <h4>Your Cart is currently empty</h4>
                <Button className="btn-org btn-sm" onClick={context.toggleCartPanel(false)}>Continue Shopping</Button>
              </div>
            </>

        }



      </Drawer>









      {/* Address Panel */}
      <Drawer
        open={context.openAddressPanel}
        onClose={context.toggleAddressPanel(false)}
        anchor={"right"}
        className="addressPanel"
      >
        <div className="flex items-center justify-between py-3 px-4 gap-3 border-b border-[rgba(0,0,0,0.1)] overflow-hidden">
          <h4>{context?.addressMode === "add" ? 'Add' : 'Edit'} Delivery Address </h4>
          <IoCloseSharp className="text-[20px] cursor-pointer" onClick={context.toggleAddressPanel(false)} />
        </div>



        <div className="w-full max-h-[100vh] overflow-auto">
          <AddAddress />
        </div>



      </Drawer>





      <Dialog
        open={context?.openProductDetailsModal.open}
        fullWidth={context?.fullWidth}
        maxWidth={context?.maxWidth}
        onClose={context?.handleCloseProductDetailsModal}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        className="productDetailsModal"
      >
        <DialogContent>
          <div className="flex items-center w-full productDetailsModalContainer relative">
            <Button
              className="!w-[40px] !h-[40px] !min-w-[40px] !rounded-full !text-[#000] !absolute top-[15px] right-[15px] !bg-[#f1f1f1]"
              onClick={context?.handleCloseProductDetailsModal}
            >
              <IoCloseSharp className="text-[20px]" />
            </Button>
            {
              context?.openProductDetailsModal?.item?.length !== 0 &&
              <>
                <div className="col1 w-[40%] px-3 py-8">
                  <ProductZoom images={context?.openProductDetailsModal?.item?.images} />
                </div>

                <div className="col2 w-[60%] py-8 px-8 pr-16 productContent ">
                  <ProductDetailsComponent item={context?.openProductDetailsModal?.item} />
                </div>
              </>
            }

          </div>
        </DialogContent>
      </Dialog>



    </>
  );
};

export default Footer;
