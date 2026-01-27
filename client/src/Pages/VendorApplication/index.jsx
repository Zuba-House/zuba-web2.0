import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { postData } from '../../utils/api';
import toast from 'react-hot-toast';
import { 
  FaStore, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaEnvelope, 
  FaGlobe, 
  FaFileAlt,
  FaCheckCircle,
  FaArrowRight,
  FaUsers,
  FaChartLine,
  FaShieldAlt,
  FaBolt
} from 'react-icons/fa';

const VendorApplication = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    storeName: '',
    storeDescription: '',
    country: '',
    city: '',
    addressLine1: '',
    addressLine2: '',
    postalCode: '',
    website: '',
    socialMedia: '',
    additionalInfo: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.storeName || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await postData('/api/vendor/application', formData);
      
      if (response?.error === false) {
        setIsSubmitted(true);
        toast.success('Application submitted successfully! We will review and get back to you soon.');
      } else {
        toast.error(response?.message || 'Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Application error:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b2735] via-[#0b2735] to-[#1a3d4f] py-12 px-4">
        <div className="container max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
            <div className="mb-6">
              <FaCheckCircle className="w-20 h-20 text-green-500 mx-auto" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Application Submitted Successfully!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Thank you for your interest in selling on Zuba House. We've received your application and will review it shortly.
            </p>
            <p className="text-md text-gray-500 mb-8">
              You will receive a confirmation email shortly. Our team will contact you within 2-3 business days.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="inline-flex items-center justify-center px-6 py-3 bg-[#efb291] text-[#0b2735] rounded-lg font-semibold hover:bg-[#e5a67d] transition-colors"
              >
                Back to Home
              </Link>
              <a
                href="https://vendor.zubahouse.com/login"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-[#0b2735] text-[#0b2735] rounded-lg font-semibold hover:bg-[#0b2735] hover:text-white transition-colors"
              >
                Seller Login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b2735] via-[#0b2735] to-[#1a3d4f] py-12 px-4">
      <div className="container max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Start Selling on Zuba House
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join thousands of successful sellers reaching millions of customers across Africa and beyond
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Benefits Section */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 text-white mb-6">
              <h2 className="text-2xl font-bold mb-6">Why Sell on Zuba House?</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <FaUsers className="w-6 h-6 text-[#efb291] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Reach Millions</h3>
                    <p className="text-sm text-gray-300">Access a global customer base across 8+ countries</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <FaChartLine className="w-6 h-6 text-[#efb291] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Grow Your Business</h3>
                    <p className="text-sm text-gray-300">Scale your sales with our powerful platform tools</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <FaShieldAlt className="w-6 h-6 text-[#efb291] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Secure Payments</h3>
                    <p className="text-sm text-gray-300">Get paid securely with multiple payout options</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <FaBolt className="w-6 h-6 text-[#efb291] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Easy Setup</h3>
                    <p className="text-sm text-gray-300">Get started in minutes with our simple onboarding</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
              <h3 className="font-semibold mb-4">Already have an account?</h3>
              <a
                href="https://vendor.zubahouse.com/login"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#efb291] hover:text-[#e5a67d] font-medium transition-colors"
              >
                Seller Login <FaArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Application Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Vendor Application Form</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaFileAlt className="w-5 h-5 text-[#efb291]" />
                    Personal Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#efb291] focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#efb291] focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaPhone className="w-5 h-5 text-[#efb291]" />
                    Contact Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#efb291] focus:border-transparent"
                        placeholder="+250 123 456 789"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        WhatsApp (Optional)
                      </label>
                      <input
                        type="tel"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#efb291] focus:border-transparent"
                        placeholder="+250 123 456 789"
                      />
                    </div>
                  </div>
                </div>

                {/* Store Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaStore className="w-5 h-5 text-[#efb291]" />
                    Store Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Store Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="storeName"
                        value={formData.storeName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#efb291] focus:border-transparent"
                        placeholder="My Awesome Store"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Store Description
                      </label>
                      <textarea
                        name="storeDescription"
                        value={formData.storeDescription}
                        onChange={handleChange}
                        rows="4"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#efb291] focus:border-transparent"
                        placeholder="Tell us about your store and products..."
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Website (Optional)
                        </label>
                        <input
                          type="url"
                          name="website"
                          value={formData.website}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#efb291] focus:border-transparent"
                          placeholder="https://mystore.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Social Media (Optional)
                        </label>
                        <input
                          type="text"
                          name="socialMedia"
                          value={formData.socialMedia}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#efb291] focus:border-transparent"
                          placeholder="@instagram, @facebook, etc."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaMapMarkerAlt className="w-5 h-5 text-[#efb291]" />
                    Location Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#efb291] focus:border-transparent"
                        placeholder="Rwanda"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#efb291] focus:border-transparent"
                        placeholder="Kigali"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        name="addressLine1"
                        value={formData.addressLine1}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#efb291] focus:border-transparent"
                        placeholder="Street address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        name="addressLine2"
                        value={formData.addressLine2}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#efb291] focus:border-transparent"
                        placeholder="Apartment, suite, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#efb291] focus:border-transparent"
                        placeholder="12345"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Information
                  </label>
                  <textarea
                    name="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#efb291] focus:border-transparent"
                    placeholder="Any additional information you'd like to share..."
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#efb291] text-[#0b2735] py-3 px-6 rounded-lg font-semibold hover:bg-[#e5a67d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Application
                        <FaArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    By submitting this form, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorApplication;
