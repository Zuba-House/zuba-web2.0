import React, { useContext, useRef, useState } from "react";
import InnerImageZoom from "react-inner-image-zoom";
import "react-inner-image-zoom/lib/InnerImageZoom/styles.css";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import { MyContext } from "../../App";

export const ProductZoom = (props) => {

  const [slideIndex, setSlideIndex] = useState(0);
  const zoomSliderBig = useRef();
  const zoomSliderSml = useRef();

  const context = useContext(MyContext);

  const goto = (index) => {
    setSlideIndex(index);
    zoomSliderSml.current.swiper.slideTo(index);
    zoomSliderBig.current.swiper.slideTo(index);
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="slider w-full lg:w-[15%] order-2 lg:order-1">
          <Swiper
            ref={zoomSliderSml}
            direction={context?.windowWidth < 992 ? "horizontal" : "vertical"}
            slidesPerView={5}
            spaceBetween={10}
            navigation={context?.windowWidth < 992 ? false : true}
            modules={[Navigation]}
            className={`zoomProductSliderThumbs h-auto lg:h-[500px] overflow-hidden ${props?.images?.length > 5 && 'space'}`}
          >
            {
              props?.images?.map((item, index) => {
                // Handle both string and object formats
                const imageUrl = typeof item === 'string' ? item : (item?.url || item);
                if (!imageUrl) return null;
                
                return (
                  <SwiperSlide key={index}>
                    <div className={`item rounded-md overflow-hidden cursor-pointer group h-[100%] ${slideIndex === index ? 'opacity-1' : 'opacity-30'}`} onClick={() => goto(index)}>
                      <img
                        src={imageUrl}
                        alt={`Product image ${index + 1}`}
                      />
                    </div>
                  </SwiperSlide>
                )
              }).filter(Boolean)
            }

          </Swiper>
        </div>

        <div className="zoomContainer w-full lg:w-[85%] h-auto lg:h-[500px] overflow-hidden rounded-md  order-1 lg:order-2">
          <Swiper
            ref={zoomSliderBig}
            slidesPerView={1}
            spaceBetween={0}
            navigation={false}
          >
            {
              props?.images?.map((item, index) => {
                // Handle both string and object formats
                const imageUrl = typeof item === 'string' ? item : (item?.url || item);
                if (!imageUrl) return null;
                
                return (
                  <SwiperSlide key={index}>
                    <InnerImageZoom
                      zoomType="hover"
                      zoomScale={1}
                      src={imageUrl}
                      alt={`Product image ${index + 1}`}
                    />
                  </SwiperSlide>
                )
              }).filter(Boolean)
            }



          </Swiper>
        </div>
      </div>
    </>
  );
};
