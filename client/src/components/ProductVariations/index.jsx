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
    if (!product?.variations || product.variations.length === 0) {
      console.log('ProductVariations - No variations found for attribute:', attributeName);
      return [];
    }
    
    const values = new Set();
    product.variations.forEach(variation => {
      if (variation.attributes && Array.isArray(variation.attributes)) {
        const attr = variation.attributes.find(a => {
          // Handle both object format {name, value} and string format
          if (typeof a === 'object' && a.name === attributeName) {
            return true;
          }
          return false;
        });
        
        if (attr) {
          // Extract value - could be attr.value, attr.label, or just attr
          const value = attr.value || attr.label || attr;
          if (value) {
            values.add(value);
          }
        }
      }
    });
    
    const valuesArray = Array.from(values);
    console.log(`ProductVariations - Values for ${attributeName}:`, valuesArray);
    return valuesArray;
  };

  // Get all attribute names
  const getAttributeNames = () => {
    // First, try to get from product.attributes
    if (product?.attributes && product.attributes.length > 0) {
      const names = product.attributes
        .filter(attr => attr.visible !== false && attr.variation !== false)
        .map(attr => attr.name);
      
      if (names.length > 0) {
        console.log('ProductVariations - Attribute names from product.attributes:', names);
        return names;
      }
    }
    
    // If no attributes, extract from variations
    if (product?.variations && product.variations.length > 0) {
      const names = new Set();
      product.variations.forEach(variation => {
        if (variation.attributes && Array.isArray(variation.attributes)) {
          variation.attributes.forEach(attr => {
            if (attr && attr.name) {
              names.add(attr.name);
            }
          });
        }
      });
      const namesArray = Array.from(names);
      console.log('ProductVariations - Attribute names extracted from variations:', namesArray);
      return namesArray;
    }
    
    console.log('ProductVariations - No attribute names found');
    return [];
  };

  // Check if a variation is available (in stock)
  const isVariationAvailable = (variation) => {
    return variation.stock > 0 && variation.stockStatus === 'in_stock';
  };

  // Debug logging
  useEffect(() => {
    if (product) {
      console.log('ProductVariations - Product data:', {
        productType: product.productType,
        hasVariations: !!product.variations,
        variationsCount: product.variations?.length || 0,
        hasAttributes: !!product.attributes,
        attributesCount: product.attributes?.length || 0,
        variations: product.variations,
        attributes: product.attributes
      });
    }
  }, [product]);

  // Check if product is variable - be more lenient with checks
  const isVariableProduct = product?.productType === 'variable' || 
                           (product?.variations && product.variations.length > 0) ||
                           (product?.attributes && product.attributes.length > 0);

  if (!product || !isVariableProduct) {
    console.log('ProductVariations - Not rendering:', {
      hasProduct: !!product,
      isVariableProduct,
      productType: product?.productType,
      variationsCount: product?.variations?.length || 0
    });
    return null;
  }

  const attributeNames = getAttributeNames();

  if (attributeNames.length === 0) {
    // If no attributes but has variations, show a message or extract from variations
    if (product.variations && product.variations.length > 0) {
      console.log('ProductVariations - No attributes found, but variations exist. Variations:', product.variations);
      
      // Try to show variations directly if attributes can't be extracted
      return (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-2">
            ⚠️ This product has {product.variations.length} variation(s), but attribute structure is missing.
          </p>
          <p className="text-xs text-yellow-600">
            Please check the product data structure. Variations: {JSON.stringify(product.variations, null, 2)}
          </p>
        </div>
      );
    }
    return null;
  }

  console.log('ProductVariations - Rendering with:', {
    attributeNames,
    variationsCount: product.variations?.length || 0,
    selectedAttributes
  });

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-[16px] font-[600] text-gray-800 mb-4">Select Options:</h3>
      {attributeNames.map((attrName, index) => {
        const values = getAttributeValues(attrName);
        const selectedValue = selectedAttributes[attrName];
        
        if (values.length === 0) {
          console.warn(`ProductVariations - No values found for attribute: ${attrName}`);
          return null;
        }

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

