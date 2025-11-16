import React, { useState, useEffect, useRef } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import './ShippingAddressInput.css';

const libraries = ['places'];
const GOOGLE_API_KEY = 'AIzaSyAXshkwQXMY74fgEi0e02sTz8sKNphLM_U';

/**
 * Shipping Address Input with Google Maps Autocomplete
 * Worldwide support for shipping rate calculation
 */
const ShippingAddressInput = ({ onAddressChange, initialAddress = null }) => {
  const [address, setAddress] = React.useState({
    postal_code: initialAddress?.postal_code || initialAddress?.postalCode || initialAddress?.address?.postalCode || '',
    city: initialAddress?.city || initialAddress?.address?.city || '',
    province: initialAddress?.province || initialAddress?.provinceCode || initialAddress?.address?.provinceCode || '',
    country: initialAddress?.country || initialAddress?.countryCode || initialAddress?.address?.countryCode || 'CA',
    countryCode: initialAddress?.countryCode || initialAddress?.address?.countryCode || 'CA',
    coordinates: initialAddress?.coordinates || initialAddress?.googlePlaces?.coordinates || null
  });

  const autocompleteInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  // Load Google Maps Script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_API_KEY,
    libraries,
  });

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (isLoaded && autocompleteInputRef.current && !autocompleteRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        autocompleteInputRef.current,
        {
          fields: ['address_components', 'formatted_address', 'geometry', 'place_id'],
          types: ['address'],
          // No country restrictions - worldwide support
          componentRestrictions: undefined
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.address_components) {
          fillAddressFromPlace(place);
        }
      });

      autocompleteRef.current = autocomplete;
    }
  }, [isLoaded]);

  // Fill address from Google Places result
  const fillAddressFromPlace = (place) => {
    const components = {};
    place.address_components.forEach((component) => {
      const type = component.types[0];
      components[type] = {
        long: component.long_name,
        short: component.short_name
      };
    });

    const city = components.locality?.long || 
                 components.administrative_area_level_2?.long || 
                 components.postal_town?.long || '';
    const province = components.administrative_area_level_1?.long || '';
    const provinceCode = components.administrative_area_level_1?.short || '';
    const country = components.country?.long || '';
    const countryCode = components.country?.short || 'CA';
    const postalCode = components.postal_code?.long || '';

    const newAddress = {
      postal_code: postalCode.replace(/\s/g, '').toUpperCase(),
      city: city,
      province: provinceCode || province,
      country: country,
      countryCode: countryCode,
      coordinates: {
        lat: place.geometry?.location?.lat() || null,
        lng: place.geometry?.location?.lng() || null
      }
    };

    setAddress(newAddress);
    onAddressChange && onAddressChange(newAddress);
  };

  const handleManualChange = (field, value) => {
    const newAddress = {
      ...address,
      [field]: value
    };
    setAddress(newAddress);
    onAddressChange && onAddressChange(newAddress);
  };

  if (loadError) {
    return (
      <div className="shipping-address-error">
        <p>⚠️ Unable to load address autocomplete. Please enter address manually.</p>
      </div>
    );
  }

  return (
    <div className="shipping-address-input">
      <h4 className="text-[14px] font-[600] mb-2">
        📍 Shipping Address <span className="text-red-500">*</span> (Required)
      </h4>
      <p className="text-[12px] text-gray-600 mb-3">
        Enter your shipping address to calculate shipping rates and proceed to checkout
      </p>
      
      {/* Google Maps Autocomplete */}
      {isLoaded && (
        <div className="form-group mb-3">
          <input
            ref={autocompleteInputRef}
            type="text"
            placeholder="🔍 Search your address (anywhere in the world)..."
            className="w-full px-3 py-2 border border-gray-300 rounded text-[14px] mb-2"
          />
          <small className="text-gray-500 text-[12px]">
            Start typing to find your address (powered by Google Maps)
          </small>
        </div>
      )}

      {/* Manual Input Fields */}
      <div className="manual-inputs">
        <input
          type="text"
          placeholder="Postal/Zip Code"
          value={address.postal_code}
          onChange={(e) => handleManualChange('postal_code', e.target.value.toUpperCase().replace(/\s/g, ''))}
          className="w-full px-3 py-2 border border-gray-300 rounded mb-2 text-[14px]"
          maxLength={20}
        />
        <input
          type="text"
          placeholder="City"
          value={address.city}
          onChange={(e) => handleManualChange('city', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded mb-2 text-[14px]"
        />
        <input
          type="text"
          placeholder="State/Province"
          value={address.province}
          onChange={(e) => handleManualChange('province', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded mb-2 text-[14px]"
        />
        <select
          value={address.countryCode}
          onChange={(e) => {
            const newAddr = {
              ...address,
              countryCode: e.target.value,
              country: e.target.options[e.target.selectedIndex].text
            };
            setAddress(newAddr);
            onAddressChange && onAddressChange(newAddr);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded text-[14px]"
        >
          <option value="CA">Canada</option>
          <option value="US">United States</option>
          <option value="GB">United Kingdom</option>
          <option value="AU">Australia</option>
          <option value="DE">Germany</option>
          <option value="FR">France</option>
          <option value="IT">Italy</option>
          <option value="ES">Spain</option>
          <option value="NL">Netherlands</option>
          <option value="BE">Belgium</option>
          <option value="CH">Switzerland</option>
          <option value="AT">Austria</option>
          <option value="SE">Sweden</option>
          <option value="NO">Norway</option>
          <option value="DK">Denmark</option>
          <option value="FI">Finland</option>
          <option value="PL">Poland</option>
          <option value="CN">China</option>
          <option value="JP">Japan</option>
          <option value="KR">South Korea</option>
          <option value="IN">India</option>
          <option value="SG">Singapore</option>
          <option value="MY">Malaysia</option>
          <option value="TH">Thailand</option>
          <option value="BR">Brazil</option>
          <option value="MX">Mexico</option>
          <option value="AR">Argentina</option>
          <option value="ZA">South Africa</option>
          <option value="AE">United Arab Emirates</option>
          <option value="SA">Saudi Arabia</option>
          <option value="NZ">New Zealand</option>
          <option value="OTHER">Other Country</option>
        </select>
      </div>
    </div>
  );
};

export default ShippingAddressInput;

