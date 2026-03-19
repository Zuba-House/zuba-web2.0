import React from "react";
import { Link } from "react-router-dom";
import { getOptimizedImageUrl } from "../../utils/imageOptimizer";

const BannerBox = (props) => {
  const optimizedImg = getOptimizedImageUrl(props.img, { width: 800, height: 600, quality: 'auto', format: 'auto' });
  return (
    <div className="box bannerBox overflow-hidden rounded-lg group">
      {
        props?.item?.subCatId !== undefined && props?.item?.subCatId !== null &&  props?.item?.subCatId !== ""  ?
          <Link to={`/products?subCatId=${props?.item?.subCatId}`} className="text-[16px] font-[600] link">
            <img src={optimizedImg} className="w-full transition-all group-hover:scale-105 group-hover:rotate-1" alt="banner" loading="lazy" />
          </Link>
          :

          <Link to={`/products?catId=${props?.item?.catId}`} className="text-[16px] font-[600] link">
            <img src={optimizedImg} className="w-full transition-all group-hover:scale-105 group-hover:rotate-1" alt="banner" loading="lazy" />
          </Link>

      }

    </div>
  );
};

export default BannerBox;
