import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  FaUser,
  FaMapMarkerAlt,
  FaLink,
  FaFilePdf,
  FaPhone,
  FaEnvelope,
  FaComment,
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPalette,
  FaLaptopCode,
  FaSearch
} from "react-icons/fa";

const ApplyForm = () => {
  const { positionId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    location: "",
    phone: "",
    portfolio: "",
    resume: null,
    whyInterested: "",
    position: ""
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [resumeFileName, setResumeFileName] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    // Set position based on positionId
    const positions = {
      1: "Professional Graphic Designer"
    };
    if (positionId && positions[positionId]) {
      setFormData(prev => ({ ...prev, position: positions[positionId] }));
    }
  }, [positionId]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (file.type !== "application/pdf") {
        setErrors(prev => ({
          ...prev,
          resume: "Please upload a PDF file only"
        }));
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          resume: "File size must be less than 5MB"
        }));
        return;
      }
      setFormData(prev => ({
        ...prev,
        resume: file
      }));
      setResumeFileName(file.name);
      if (errors.resume) {
        setErrors(prev => ({
          ...prev,
          resume: ""
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.location.trim()) {
      newErrors.location = "Location is required";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    
    if (!formData.portfolio.trim()) {
      newErrors.portfolio = "Portfolio link is required";
    } else if (!/^https?:\/\/.+/.test(formData.portfolio)) {
      newErrors.portfolio = "Please enter a valid URL (starting with http:// or https://)";
    }
    
    if (!formData.resume) {
      newErrors.resume = "Resume (PDF) is required";
    }
    
    if (!formData.whyInterested.trim()) {
      newErrors.whyInterested = "Please tell us why you're interested in applying at Zuba House";
    } else if (formData.whyInterested.trim().length < 50) {
      newErrors.whyInterested = "Please provide at least 50 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Create email body
      const emailBody = `
Job Application - ${formData.position}

Applicant Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${formData.name}
Email: ${formData.email}
Location: ${formData.location}
Phone/WhatsApp: ${formData.phone}
Portfolio Link: ${formData.portfolio}

Why Interested in Zuba House:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formData.whyInterested}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Application Date: ${new Date().toLocaleString()}
Position Applied For: ${formData.position}
Application ID: APP-${Date.now()}

Note: Resume PDF should be attached separately if sending via email client.
      `.trim();

      // Create mailto link with CC
      const subject = encodeURIComponent(`Job Application: ${formData.position} - ${formData.name}`);
      const body = encodeURIComponent(emailBody);
      const mailtoLink = `mailto:info@zubahouse.com?cc=it.deboss019@gmail.com&subject=${subject}&body=${body}`;

      // Open email client
      window.location.href = mailtoLink;

      // For better UX, we'll also try to use EmailJS if available
      // But mailto is the primary method as it's more reliable
      
      setTimeout(() => {
        setLoading(false);
        setSubmitted(true);
      }, 1000);
    } catch (error) {
      console.error("Error submitting form:", error);
      setLoading(false);
      setErrors({ submit: "An error occurred. Please try again or send your application directly to info@zubahouse.com" });
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4 py-12">
        <motion.div
          className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 lg:p-12 text-center border-2 border-[#efb291]"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <FaCheckCircle className="text-5xl text-green-500" />
          </motion.div>

          <h2 className="text-3xl lg:text-4xl font-bold text-[#0b2735] mb-4">
            Application Submitted!
          </h2>

          <p className="text-gray-600 mb-6 leading-relaxed">
            Thank you for your interest in joining Zuba House! Your application has been prepared and your email client should open shortly.
          </p>

          <div className="bg-[#efb291] bg-opacity-10 border border-[#efb291] rounded-lg p-6 mb-6 text-left">
            <p className="text-sm text-gray-700 mb-2">
              <strong className="text-[#0b2735]">Important - Next Steps:</strong>
            </p>
            <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
              <li><strong>Attach your resume PDF</strong> to the email before sending</li>
              <li>Review all the information in the email body</li>
              <li>Send the email to complete your application</li>
              <li>We'll review your application and get back to you soon</li>
            </ul>
            <p className="text-xs text-gray-500 mt-3 italic">
              Note: If your email client didn't open automatically, please send your application directly to info@zubahouse.com with CC to it.deboss019@gmail.com
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/careers"
              className="bg-[#efb291] text-[#0b2735] px-8 py-4 rounded-lg font-bold hover:bg-[#e5a67d] transition-all shadow-lg hover:shadow-xl inline-flex items-center justify-center gap-2"
            >
              <FaArrowLeft />
              Back to Careers
            </Link>
            <Link
              to="/"
              className="border-2 border-[#efb291] text-[#efb291] px-8 py-4 rounded-lg font-bold hover:bg-[rgba(239,178,145,0.1)] transition-all inline-flex items-center justify-center gap-2"
            >
              Go to Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const getPositionIcon = () => {
    if (formData.position.includes("Graphic Designer")) {
      return <FaPalette className="text-[40px] text-[#efb291]" />;
    }
    return <FaUser className="text-[40px] text-[#efb291]" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0b2735] via-[#0f3547] to-[#0b2735] py-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-[#efb291] rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <Link
            to="/careers"
            className="inline-flex items-center gap-2 text-[#efb291] hover:text-[#e5a67d] transition-colors mb-6"
          >
            <FaArrowLeft />
            <span>Back to Careers</span>
          </Link>
          <div className="flex items-center gap-4 mb-4">
            {getPositionIcon()}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-[#e5e2db]">
                Application Form
              </h1>
              <p className="text-[#efb291] text-sm mt-1">
                {formData.position || "Position Application"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="container mx-auto px-4 py-12">
        <motion.div
          className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 lg:p-12 border border-gray-100"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-[#0b2735] mb-2">
                <FaUser className="inline mr-2 text-[#efb291]" />
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291] transition-all ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <FaExclamationTriangle className="text-xs" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#0b2735] mb-2">
                <FaEnvelope className="inline mr-2 text-[#efb291]" />
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291] transition-all ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="your.email@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <FaExclamationTriangle className="text-xs" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-semibold text-[#0b2735] mb-2">
                <FaMapMarkerAlt className="inline mr-2 text-[#efb291]" />
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291] transition-all ${
                  errors.location ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="City, Country"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <FaExclamationTriangle className="text-xs" />
                  {errors.location}
                </p>
              )}
            </div>

            {/* Phone/WhatsApp */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-[#0b2735] mb-2">
                <FaPhone className="inline mr-2 text-[#efb291]" />
                Phone Number (WhatsApp Preferred) <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291] transition-all ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="+250 788 123 456"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <FaExclamationTriangle className="text-xs" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Portfolio Link */}
            <div>
              <label htmlFor="portfolio" className="block text-sm font-semibold text-[#0b2735] mb-2">
                <FaLink className="inline mr-2 text-[#efb291]" />
                Portfolio Link <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                id="portfolio"
                name="portfolio"
                value={formData.portfolio}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291] transition-all ${
                  errors.portfolio ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="https://yourportfolio.com"
              />
              {errors.portfolio && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <FaExclamationTriangle className="text-xs" />
                  {errors.portfolio}
                </p>
              )}
            </div>

            {/* Resume Upload */}
            <div>
              <label htmlFor="resume" className="block text-sm font-semibold text-[#0b2735] mb-2">
                <FaFilePdf className="inline mr-2 text-[#efb291]" />
                Resume (PDF Format) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <label
                  htmlFor="resume"
                  className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#efb291] transition-all text-center"
                >
                  <input
                    type="file"
                    id="resume"
                    name="resume"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <span className="text-gray-600">
                    {resumeFileName || "Click to upload PDF (Max 5MB)"}
                  </span>
                </label>
              </div>
              {errors.resume && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <FaExclamationTriangle className="text-xs" />
                  {errors.resume}
                </p>
              )}
              {resumeFileName && !errors.resume && (
                <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                  <FaCheckCircle className="text-xs" />
                  {resumeFileName} selected
                </p>
              )}
            </div>

            {/* Why Interested */}
            <div>
              <label htmlFor="whyInterested" className="block text-sm font-semibold text-[#0b2735] mb-2">
                <FaComment className="inline mr-2 text-[#efb291]" />
                Why are you interested in applying at Zuba House? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="whyInterested"
                name="whyInterested"
                value={formData.whyInterested}
                onChange={handleChange}
                rows={6}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291] transition-all resize-none ${
                  errors.whyInterested ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Tell us why you're interested in joining Zuba House and what makes you a great fit for this position..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Minimum 50 characters ({formData.whyInterested.length} / 50)
              </p>
              {errors.whyInterested && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <FaExclamationTriangle className="text-xs" />
                  {errors.whyInterested}
                </p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <FaExclamationTriangle />
                  {errors.submit}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#efb291] text-[#0b2735] px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#e5a67d] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#0b2735]"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <FaEnvelope />
                    <span>Submit Application</span>
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center mt-3">
                Your application will be sent to info@zubahouse.com with a copy to it.deboss019@gmail.com
              </p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ApplyForm;

