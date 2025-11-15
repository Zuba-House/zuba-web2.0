import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/currency';

const ProductVariations = ({ product, onVariationSelect, selectedVariation }) => {
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [availableVariations, setAvailableVariations] = useState([]);
  const [currentVariation, setCurrentVariation] = useState(null);

  // Initialize selected attributes from default variation or first available
  useEffect(() => {
    if (product?.variations && product.variations.length > 0) {
      // Find default variation
      const defaultVariation = product.variations.find(v => v.isDefault) || product.variations[0];
      
      if (defaultVariation) {
        const initialAttributes = {};
        defaultVariation.attributes?.forEach(attr => {
          initialAttributes[attr.name] = attr.value;
        });
        setSelectedAttributes(initialAttributes);
        setCurrentVariation(defaultVariation);
        if (onVariationSelect) {
          onVariationSelect(defaultVariation);
        }
      }
    }
  }, [product]);

  // Update available variations when attributes change
  useEffect(() => {
    if (!product?.variations || product.variations.length === 0) return;

    // Filter variations based on selected attributes
    const filtered = product.variations.filter(variation => {
      if (!variation.attributes || variation.attributes.length === 0) return false;
      
      // Check if all selected attributes match this variation
      return Object.keys(selectedAttributes).every(attrName => {
        const selectedValue = selectedAttributes[attrName];
        const variationAttr = variation.attributes.find(a => a.name === attrName);
        return variationAttr && variationAttr.value === selectedValue;
      });
    });

    setAvailableVariations(filtered);
    
    // Find matching variation
    const matching = product.variations.find(variation => {
      if (!variation.attributes || variation.attributes.length === 0) return false;
      
      return Object.keys(selectedAttributes).every(attrName => {
        const selectedValue = selectedAttributes[attrName];
        const variationAttr = variation.attributes.find(a => a.name === attrName);
        return variationAttr && variationAttr.value === selectedValue;
      }) && variation.attributes.length === Object.keys(selectedAttributes).length;
    });

    if (matching) {
      setCurrentVariation(matching);
      if (onVariationSelect) {
        onVariationSelect(matching);
      }
    }
  }, [selectedAttributes, product]);

  // Handle attribute selection
  const handleAttributeChange = (attributeName, value) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [attributeName]: value
    }));
  };

  // Get unique values for an attribute
  const getAttributeValues = (attributeName) => {
    if (!product?.variations) return [];
    
    const values = new Set();
    product.variations.forEach(variation => {
      const attr = variation.attributes?.find(a => a.name === attributeName);
      if (attr) {
        // Include all values, not just in-stock ones (for better UX)
        values.add(attr.value);
      }
    });
    
    return Array.from(values);
  };

  // Get all attribute names
  const getAttributeNames = () => {
    if (!product?.attributes || product.attributes.length === 0) {
      // Extract from variations if attributes not set
      if (product?.variations && product.variations.length > 0) {
        const names = new Set();
        product.variations.forEach(variation => {
          variation.attributes?.forEach(attr => {
            names.add(attr.name);
          });
        });
        return Array.from(names);
      }
      return [];
    }
    
    return product.attributes
      .filter(attr => attr.visible !== false && attr.variation !== false)
      .map(attr => attr.name);
  };

  // Check if a variation is available (in stock)
  const isVariationAvailable = (variation) => {
    return variation.stock > 0 && variation.stockStatus === 'in_stock';
  };

  if (!product || product.productType !== 'variable' || !product.variations || product.variations.length === 0) {
    return null;
  }

  const attributeNames = getAttributeNames();

  if (attributeNames.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-4">
      {attributeNames.map((attrName, index) => {
        const values = getAttributeValues(attrName);
        const selectedValue = selectedAttributes[attrName];

        return (
          <div key={index} className="mb-4">
            <label className="block mb-2 text-[14px] font-[600] text-gray-700">
              {attrName.charAt(0).toUpperCase() + attrName.slice(1)}:
              {selectedValue && (
                <span className="ml-2 text-primary font-[500]">{selectedValue}</span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {values.map((value, valueIndex) => {
                const isSelected = selectedValue === value;
                const isAvailable = product.variations.some(v => {
                  const attr = v.attributes?.find(a => a.name === attrName && a.value === value);
                  return attr && isVariationAvailable(v);
                });

                return (
                  <button
                    key={valueIndex}
                    type="button"
                    onClick={() => handleAttributeChange(attrName, value)}
                    disabled={!isAvailable}
                    className={`px-4 py-2 rounded-md text-[13px] font-[500] transition-all ${
                      isSelected
                        ? 'bg-primary text-white border-2 border-primary'
                        : isAvailable
                        ? 'bg-white text-gray-700 border-2 border-gray-300 hover:border-primary hover:text-primary'
                        : 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed opacity-50'
                    }`}
                    style={{
                      minWidth: attrName.toLowerCase() === 'color' ? '60px' : 'auto',
                      height: attrName.toLowerCase() === 'color' ? '60px' : 'auto',
                      backgroundColor: attrName.toLowerCase() === 'color' && isSelected && isAvailable 
                        ? (value.toLowerCase() === 'red' ? '#ef4444' : 
                           value.toLowerCase() === 'blue' ? '#3b82f6' :
                           value.toLowerCase() === 'green' ? '#10b981' :
                           value.toLowerCase() === 'black' ? '#000000' :
                           value.toLowerCase() === 'white' ? '#ffffff' :
                           value.toLowerCase() === 'yellow' ? '#fbbf24' :
                           'transparent')
                        : undefined
                    }}
                  >
                    {attrName.toLowerCase() === 'color' ? (
                      <div 
                        className="w-full h-full rounded"
                        style={{
                          backgroundColor: value.toLowerCase() === 'red' ? '#ef4444' : 
                                         value.toLowerCase() === 'blue' ? '#3b82f6' :
                                         value.toLowerCase() === 'green' ? '#10b981' :
                                         value.toLowerCase() === 'black' ? '#000000' :
                                         value.toLowerCase() === 'white' ? '#ffffff' :
                                         value.toLowerCase() === 'yellow' ? '#fbbf24' :
                                         value.toLowerCase() === 'orange' ? '#f97316' :
                                         value.toLowerCase() === 'purple' ? '#a855f7' :
                                         value.toLowerCase() === 'pink' ? '#ec4899' :
                                         value.toLowerCase() === 'gray' ? '#6b7280' :
                                         value.toLowerCase() === 'grey' ? '#6b7280' :
                                         '#e5e7eb',
                          border: '2px solid',
                          borderColor: isSelected ? '#efb291' : '#d1d5db'
                        }}
                        title={value}
                      />
                    ) : (
                      value
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Display current variation details */}
      {currentVariation && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] font-[600] text-gray-700">Selected Variation:</span>
            <span className="text-[14px] text-gray-600">
              {currentVariation.sku && `SKU: ${currentVariation.sku}`}
            </span>
          </div>
          
          <div className="flex items-center gap-4 mt-2">
            <div>
              <span className="text-[12px] text-gray-500">Price:</span>
              <div className="flex items-center gap-2">
                {currentVariation.salePrice && currentVariation.salePrice < currentVariation.regularPrice ? (
                  <>
                    <span className="oldPrice line-through text-gray-500 text-[16px] font-[500]">
                      {formatCurrency(currentVariation.regularPrice)}
                    </span>
                    <span className="price text-primary text-[18px] font-[600]">
                      {formatCurrency(currentVariation.salePrice)}
                    </span>
                  </>
                ) : (
                  <span className="price text-primary text-[18px] font-[600]">
                    {formatCurrency(currentVariation.regularPrice || currentVariation.price)}
                  </span>
                )}
              </div>
            </div>
            
            <div>
              <span className="text-[12px] text-gray-500">Stock:</span>
              <span className={`text-[14px] font-[600] ml-2 ${
                isVariationAvailable(currentVariation) ? 'text-green-600' : 'text-red-600'
              }`}>
                {currentVariation.stock > 0 ? `${currentVariation.stock} available` : 'Out of stock'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVariations;

