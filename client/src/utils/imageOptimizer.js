/**
 * Image Optimization Utility
 * Optimizes Cloudinary URLs and handles image loading strategies
 */

/**
 * Optimize Cloudinary URL with transformations
 * @param {string} url - Cloudinary image URL
 * @param {Object} options - Optimization options
 * @param {number} options.width - Desired width (optional)
 * @param {number} options.height - Desired height (optional)
 * @param {number} options.quality - Quality 1-100 (default: auto for best compression)
 * @param {string} options.format - Format: auto, webp, jpg, png (default: auto)
 * @param {string} options.crop - Crop mode: fill, fit, scale, etc. (default: auto)
 * @returns {string} - Optimized Cloudinary URL
 */
export const optimizeCloudinaryUrl = (url, options = {}) => {
  if (!url || typeof url !== 'string') return url;
  
  // If not a Cloudinary URL, return as is
  if (!url.includes('res.cloudinary.com')) return url;
  
  // Check if already has transformations (has transformation params like w_, h_, q_, f_)
  if (url.includes('/image/upload/')) {
    const parts = url.split('/image/upload/');
    if (parts[1] && (parts[1].includes('w_') || parts[1].includes('h_') || parts[1].includes('q_') || parts[1].includes('f_'))) {
      // Already has transformations, return as is
      return url;
    }
  }
  
  const {
    width,
    height,
    quality = 'auto', // Cloudinary auto quality is excellent
    format = 'auto', // Auto format (WebP when supported)
    crop = 'auto'
  } = options;
  
  // Build transformation string
  const transformations = [];
  
  if (width || height) {
    let size = '';
    if (width && height) {
      size = `w_${width},h_${height},c_${crop}`;
    } else if (width) {
      size = `w_${width},c_scale`;
    } else if (height) {
      size = `h_${height},c_scale`;
    }
    if (size) transformations.push(size);
  }
  
  if (quality !== 'auto') {
    transformations.push(`q_${quality}`);
  } else {
    transformations.push('q_auto'); // Best compression
  }
  
  if (format !== 'auto') {
    transformations.push(`f_${format}`);
  } else {
    transformations.push('f_auto'); // Auto format (WebP when supported)
  }
  
  // Insert transformations into Cloudinary URL
  if (transformations.length > 0) {
    const transformString = transformations.join(',');
    
    // Handle different Cloudinary URL formats
    if (url.includes('/image/upload/')) {
      // Standard format: .../image/upload/v1234567890/path/to/image.jpg
      // Insert transformations after /image/upload/ and before version or path
      const uploadIndex = url.indexOf('/image/upload/');
      const afterUpload = url.substring(uploadIndex + '/image/upload/'.length);
      
      // Check if there's a version number (starts with 'v' followed by digits)
      const versionMatch = afterUpload.match(/^v\d+/);
      if (versionMatch) {
        // Insert transformations after version
        url = url.replace(
          `/image/upload/${versionMatch[0]}/`,
          `/image/upload/${transformString}/${versionMatch[0]}/`
        );
      } else {
        // No version, insert transformations directly
        url = url.replace(
          '/image/upload/',
          `/image/upload/${transformString}/`
        );
      }
    } else if (url.includes('/image/fetch/')) {
      // Fetch format: .../image/fetch/.../url
      url = url.replace(
        '/image/fetch/',
        `/image/fetch/${transformString}/`
      );
    }
  }
  
  return url;
};

/**
 * Get optimized product image URL
 * @param {string|Object} image - Image URL or object
 * @param {Object} options - Optimization options
 * @returns {string} - Optimized image URL
 */
export const getOptimizedImageUrl = (image, options = {}) => {
  if (!image) return '';
  
  // Extract URL from object if needed
  let url = '';
  if (typeof image === 'string') {
    url = image;
  } else if (typeof image === 'object' && image.url) {
    url = image.url;
  } else if (typeof image === 'object' && image.src) {
    url = image.src;
  }
  
  if (!url) return '';
  
  // Optimize if it's a Cloudinary URL
  if (url.includes('res.cloudinary.com')) {
    return optimizeCloudinaryUrl(url, options);
  }
  
  return url;
};

/**
 * Preload image for faster display
 * @param {string} url - Image URL to preload
 * @returns {Promise} - Promise that resolves when image is loaded
 */
export const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('No URL provided'));
      return;
    }
    
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * Check if image is from Cloudinary
 * @param {string} url - Image URL
 * @returns {boolean}
 */
export const isCloudinaryUrl = (url) => {
  return url && typeof url === 'string' && url.includes('res.cloudinary.com');
};

/**
 * Get default optimization options for different image types
 */
export const getDefaultOptions = {
  logo: () => ({ width: 400, height: 200, quality: 90, format: 'auto' }),
  thumbnail: () => ({ width: 300, height: 300, quality: 'auto', format: 'auto' }),
  product: () => ({ width: 600, height: 600, quality: 'auto', format: 'auto' }),
  banner: () => ({ width: 1200, height: 600, quality: 'auto', format: 'auto' }),
  large: () => ({ width: 1200, quality: 'auto', format: 'auto' })
};

