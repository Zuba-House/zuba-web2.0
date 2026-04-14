import { useContext } from "react";
import { Link } from "react-router-dom";
import { MdOutlineDeleteOutline } from "react-icons/md";
import Button from "@mui/material/Button";
import { MyContext } from "../../App";
import { deleteData } from "../../utils/api";
import { getOptimizedImageUrl } from "../../utils/imageOptimizer";

const CartPanel = (props) => {

  const context = useContext(MyContext);
  const getShortTitle = (title = "", max = 40) =>
    title.length > max ? `${title.slice(0, max)}...` : title;

  const removeItem = (id) => {
    // Check if this is a guest cart item
    const isGuestItem = id?.toString().startsWith('guest_');
    
    if (isGuestItem || !context?.isLogin) {
      // Remove from guest cart
      if (context?.removeFromGuestCart) {
        context.removeFromGuestCart(id);
      }
    } else {
      // Remove from server cart
      deleteData(`/api/cart/delete-cart-item/${id}`).then(() => {
        context.alertBox("success", "Item Removed ");
        context?.getCartItems();
      })
    }
  }


  return (
    <div className="cart-panel-layout flex h-[calc(100vh-60px)] flex-col">
      <div className="cart-panel-items scroll w-full flex-1 overflow-y-auto overflow-x-hidden py-3 px-4">

        {

          props?.data?.map((item, index) => {
            return (
              <div key={item?._id || `${item?.productId}-${index}`} className="cartItem cart-panel-item w-full flex items-start gap-3 border-b border-[rgba(0,0,0,0.1)] pb-3 mb-3">
                <div className="img cart-panel-img w-[25%] overflow-hidden h-[80px] rounded-md" onClick={context.toggleCartPanel(false)}>
                  <Link to={`/product/${item?.productId}`} className="block group">
                    <img
                      src={getOptimizedImageUrl(item?.image, { width: 160, height: 160, quality: 'auto', format: 'auto' })}
                      className="w-full group-hover:scale-105"
                      loading="lazy"
                      alt=""
                    />
                  </Link>
                </div>

                <div className="info cart-panel-info w-[75%] pr-7 relative pt-1">
                  <h4 className="text-[12px] sm:text-[14px] font-[500] leading-[1.35]" onClick={context.toggleCartPanel(false)}>
                    <Link to={`/product/${item?.productId}`} className="link transition-all">
                      {getShortTitle(item?.productTitle, context?.windowWidth < 576 ? 34 : 42)}
                    </Link>
                  </h4>
                  <p className="cart-panel-meta flex items-center gap-3 mt-2 mb-0 flex-wrap">
                    <span className="text-[13px] sm:text-[14px]">
                      Qty : <span>{item?.quantity}</span>
                    </span>
                    <span className="text-primary font-bold">{context?.formatPrice((item?.price || 0) * (item?.quantity || 0))}</span>
                  </p>

                  <MdOutlineDeleteOutline className="cart-panel-remove absolute top-[2px] right-[0px] cursor-pointer text-[20px] link transition-all" onClick={() => removeItem(item?._id)} />
                </div>
              </div>
            )
          })


        }



      </div>

      <div className="bottomSec cart-panel-summary border-t border-[rgba(0,0,0,0.1)] bg-white px-4 py-3">
        <div className="bottomInfo pb-2 w-full flex items-center justify-between flex-col">
          <div className="flex items-center justify-between w-full">
            <span className="text-[14px] font-[600]">{context?.cartData?.length} item{context?.cartData?.length === 1 ? "" : "s"}</span>
            <span className="text-primary font-bold">
              {context?.formatPrice(
                (context.cartData?.length !== 0 ?
                  context.cartData?.map(item => parseFloat(item.price || 0) * (item.quantity || 0))
                    .reduce((total, value) => total + value, 0) : 0)
              )}
            </span>
          </div>

        </div>
        <div className="bottomInfo pt-2 w-full border-t border-[rgba(0,0,0,0.1)] flex items-center justify-between flex-col">
          <div className="flex items-center justify-between w-full">
            <span className="text-[14px] font-[600]">Total (tax excl.)</span>
            <span className="text-primary font-bold">
              {context?.formatPrice(
                (context.cartData?.length !== 0 ?
                  context.cartData?.map(item => parseFloat(item.price || 0) * (item.quantity || 0))
                    .reduce((total, value) => total + value, 0) : 0)
              )}
            </span>
          </div>

          <div className="flex items-center justify-between w-full gap-2 mt-3">
            <Link to="/cart" className=" w-[50%] d-block" onClick={context.toggleCartPanel(false)}>
              <Button className="btn-org btn-lg w-full">View Cart</Button>
            </Link>
            <Link to="/cart" className=" w-[50%] d-block" onClick={context.toggleCartPanel(false)}>
              <Button className="btn-org btn-border btn-lg w-full">Checkout</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPanel;
