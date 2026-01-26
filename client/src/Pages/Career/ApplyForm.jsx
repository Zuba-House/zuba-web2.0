import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useParams } from "react-router-dom";
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
  FaGraduationCap,
  FaBriefcase,
  FaTools,
  FaVideo,
  FaClock,
  FaCheck,
  FaInfoCircle
} from "react-icons/fa";
import axios from "axios";

const ApplyForm = () => {
  const { positionId } = useParams();
  const apiUrl = import.meta.env.VITE_API_URL;
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    location: "",
    phone: "",
    portfolio: "",
    education: "",
    fieldOfStudy: "",
    currentStatus: "",
    yearsOfExperience: "",
    designTools: [],
    videoExperience: "",
    workAvailability: "",
    contractConfirmation: "",
    technicalReadiness: "",
    whyInterested: "",
    additionalInfo: "",
    position: ""
  });
  
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [resumeFileName, setResumeFileName] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [positionClosed, setPositionClosed] = useState(false);

  const designToolsOptions = [
    "Adobe Photoshop",
    "Adobe Illustrator",
    "Adobe InDesign",
    "Adobe After Effects",
    "Adobe Premiere Pro",
    "Figma",
    "Canva",
    "Other"
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
    const positions = {
      1: {
        title: "Professional Graphic Designer",
        isActive: false, // Position closed - deadline was January 20
        status: "Hiring Complete"
      }
    };
    if (positionId && positions[positionId]) {
      const position = positions[positionId];
      if (!position.isActive) {
        // Position is closed, set error state
        setPositionClosed(true);
        setErrors({ 
          closed: `This position is no longer accepting applications. ${position.status || 'Hiring Complete'}. The application deadline was January 20.` 
        });
      } else {
        setFormData(prev => ({ ...prev, position: position.title }));
      }
    } else if (positionId) {
      setPositionClosed(true);
      setErrors({ closed: "Position not found." });
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
    const { name, value, type, checked } = e.target;
    
    if (type === "checkbox") {
      if (name === "designTools") {
        setFormData(prev => {
          const tools = [...prev.designTools];
          if (checked) {
            tools.push(value);
          } else {
            const index = tools.indexOf(value);
            if (index > -1) tools.splice(index, 1);
          }
          return { ...prev, designTools: tools };
        });
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
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
      if (file.type !== "application/pdf") {
        setErrors(prev => ({
          ...prev,
          resume: "Please upload a PDF file only"
        }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          resume: "File size must be less than 5MB"
        }));
        return;
      }
      setResume(file);
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
    
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.portfolio.trim()) {
      newErrors.portfolio = "Portfolio link is required";
    } else if (!/^https?:\/\/.+/.test(formData.portfolio)) {
      newErrors.portfolio = "Please enter a valid URL (starting with http:// or https://)";
    }
    if (!formData.education) newErrors.education = "Education level is required";
    if (!formData.currentStatus) newErrors.currentStatus = "Current status is required";
    if (!formData.yearsOfExperience) newErrors.yearsOfExperience = "Years of experience is required";
    if (formData.designTools.length === 0) newErrors.designTools = "Please select at least one design tool";
    if (!formData.videoExperience) newErrors.videoExperience = "Please specify video design experience";
    if (!formData.workAvailability) newErrors.workAvailability = "Please specify work availability";
    if (!formData.contractConfirmation) newErrors.contractConfirmation = "Please confirm contract requirement";
    if (!formData.technicalReadiness) newErrors.technicalReadiness = "Please confirm technical readiness";
    if (!resume) newErrors.resume = "Resume (PDF) is required";
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
    
    // Prevent submission if position is closed
    if (positionClosed) {
      setErrors({ submit: "This position is no longer accepting applications." });
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("email", formData.email);
      submitData.append("location", formData.location);
      submitData.append("phone", formData.phone);
      submitData.append("portfolio", formData.portfolio);
      submitData.append("education", formData.education);
      if (formData.fieldOfStudy) submitData.append("fieldOfStudy", formData.fieldOfStudy);
      submitData.append("currentStatus", formData.currentStatus);
      submitData.append("yearsOfExperience", formData.yearsOfExperience);
      submitData.append("designTools", JSON.stringify(formData.designTools));
      submitData.append("videoExperience", formData.videoExperience);
      submitData.append("workAvailability", formData.workAvailability);
      submitData.append("contractConfirmation", formData.contractConfirmation);
      submitData.append("technicalReadiness", formData.technicalReadiness);
      submitData.append("whyInterested", formData.whyInterested);
      if (formData.additionalInfo) submitData.append("additionalInfo", formData.additionalInfo);
      submitData.append("position", formData.position);
      if (positionId) submitData.append("positionId", positionId);
      submitData.append("resume", resume);

      const response = await axios.post(
        `${apiUrl}/api/job-application/submit`,
        submitData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data && response.data.success) {
        setApplicationId(response.data.applicationId);
        setSubmitted(true);
      } else {
        setErrors({ 
          submit: response.data?.error || response.data?.message || "Failed to submit application. Please try again." 
        });
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      
      let errorMessage = "An error occurred. Please try again.";
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.error || 
                      error.response.data?.message || 
                      `Server error: ${error.response.status}`;
        
        // Handle specific error cases
        if (error.response.status === 400) {
          if (error.response.data?.missingFields) {
            errorMessage = `Please fill in all required fields: ${error.response.data.missingFields.join(', ')}`;
          }
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else {
        // Error setting up the request
        errorMessage = error.message || "An unexpected error occurred.";
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
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
            Application Submitted Successfully!
          </h2>

          <p className="text-gray-600 mb-6 leading-relaxed">
            Thank you for your interest in joining Zuba House! Your application has been received and will be reviewed by our team.
          </p>

          {applicationId && (
            <div className="bg-[#efb291] bg-opacity-10 border border-[#efb291] rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <strong className="text-[#0b2735]">Application ID:</strong> <span className="text-[#efb291] font-mono">{applicationId}</span>
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
            <p className="text-sm text-gray-700 mb-2">
              <strong className="text-[#0b2735]">What's Next?</strong>
            </p>
            <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
              <li>We'll review your application and portfolio</li>
              <li>If selected, we'll contact you via email or phone</li>
              <li>Applications are reviewed on a rolling basis</li>
              <li>You'll hear from us soon!</li>
            </ul>
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

  // Show closed position message if position is closed
  if (positionClosed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4 py-12">
        <motion.div
          className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 lg:p-12 text-center border-2 border-red-200"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="bg-red-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <FaExclamationTriangle className="text-5xl text-red-500" />
          </motion.div>

          <h2 className="text-3xl lg:text-4xl font-bold text-[#0b2735] mb-4">
            Position Closed
          </h2>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-gray-700 mb-2 leading-relaxed">
              {errors.closed || "This position is no longer accepting applications."}
            </p>
            <p className="text-sm text-gray-600">
              The application deadline for this position was <strong>January 20</strong>. We have completed hiring for this role.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
            <p className="text-sm text-gray-700 mb-2">
              <strong className="text-[#0b2735]">Thank you for your interest!</strong>
            </p>
            <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
              <li>We have completed hiring for this position</li>
              <li>Check back for future opportunities on our careers page</li>
              <li>Our internship program will launch in Summer 2026</li>
            </ul>
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
                placeholder="Enter your full legal name"
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

            {/* Phone */}
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
                placeholder="+250 7XX XXX XXX"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <FaExclamationTriangle className="text-xs" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Education */}
            <div>
              <label htmlFor="education" className="block text-sm font-semibold text-[#0b2735] mb-2">
                <FaGraduationCap className="inline mr-2 text-[#efb291]" />
                Highest Level of Education <span className="text-red-500">*</span>
              </label>
              <select
                id="education"
                name="education"
                value={formData.education}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291] transition-all ${
                  errors.education ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">(Select one)</option>
                <option value="High School">High School</option>
                <option value="Diploma">Diploma</option>
                <option value="Bachelor's Degree">Bachelor's Degree</option>
                <option value="Master's Degree">Master's Degree</option>
                <option value="Currently a Student">Currently a Student</option>
                <option value="Other">Other (please specify)</option>
              </select>
              {errors.education && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <FaExclamationTriangle className="text-xs" />
                  {errors.education}
                </p>
              )}
            </div>

            {/* Field of Study */}
            {formData.education && formData.education !== "High School" && (
              <div>
                <label htmlFor="fieldOfStudy" className="block text-sm font-semibold text-[#0b2735] mb-2">
                  Field of Study (if applicable)
                </label>
                <input
                  type="text"
                  id="fieldOfStudy"
                  name="fieldOfStudy"
                  value={formData.fieldOfStudy}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291] transition-all"
                  placeholder="e.g., Graphic Design, Visual Arts, Multimedia, Computer Science"
                />
              </div>
            )}

            {/* Current Status */}
            <div>
              <label htmlFor="currentStatus" className="block text-sm font-semibold text-[#0b2735] mb-2">
                <FaBriefcase className="inline mr-2 text-[#efb291]" />
                Current Status <span className="text-red-500">*</span>
              </label>
              <select
                id="currentStatus"
                name="currentStatus"
                value={formData.currentStatus}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291] transition-all ${
                  errors.currentStatus ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">(Select one)</option>
                <option value="Employed (Full-time)">Employed (Full-time)</option>
                <option value="Employed (Part-time / Freelance)">Employed (Part-time / Freelance)</option>
                <option value="Self-employed / Freelancer">Self-employed / Freelancer</option>
                <option value="Student">Student</option>
                <option value="Unemployed">Unemployed</option>
              </select>
              {errors.currentStatus && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <FaExclamationTriangle className="text-xs" />
                  {errors.currentStatus}
                </p>
              )}
            </div>

            {/* Years of Experience */}
            <div>
              <label htmlFor="yearsOfExperience" className="block text-sm font-semibold text-[#0b2735] mb-2">
                <FaBriefcase className="inline mr-2 text-[#efb291]" />
                Years of Professional Design Experience <span className="text-red-500">*</span>
              </label>
              <select
                id="yearsOfExperience"
                name="yearsOfExperience"
                value={formData.yearsOfExperience}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291] transition-all ${
                  errors.yearsOfExperience ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">(Select one)</option>
                <option value="Less than 1 year">Less than 1 year</option>
                <option value="1–2 years">1–2 years</option>
                <option value="2–4 years">2–4 years</option>
                <option value="5+ years">5+ years</option>
              </select>
              {errors.yearsOfExperience && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <FaExclamationTriangle className="text-xs" />
                  {errors.yearsOfExperience}
                </p>
              )}
            </div>

            {/* Portfolio */}
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
              <p className="mt-1 text-xs text-gray-500">(Must include graphic and/or video design work)</p>
              {errors.portfolio && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <FaExclamationTriangle className="text-xs" />
                  {errors.portfolio}
                </p>
              )}
            </div>

            {/* Design Tools */}
            <div>
              <label className="block text-sm font-semibold text-[#0b2735] mb-2">
                <FaTools className="inline mr-2 text-[#efb291]" />
                Design Tools You Use <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">(Select all that apply)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {designToolsOptions.map((tool) => (
                  <label key={tool} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="designTools"
                      value={tool}
                      checked={formData.designTools.includes(tool)}
                      onChange={handleChange}
                      className="w-4 h-4 text-[#efb291] border-gray-300 rounded focus:ring-[#efb291]"
                    />
                    <span className="text-sm text-gray-700">{tool}</span>
                  </label>
                ))}
              </div>
              {formData.designTools.includes("Other") && (
                <input
                  type="text"
                  name="designToolsOther"
                  placeholder="Please specify other tools"
                  className="mt-3 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291]"
                  onChange={(e) => {
                    const tools = [...formData.designTools];
                    const otherIndex = tools.indexOf("Other");
                    if (otherIndex > -1) {
                      tools[otherIndex] = `Other: ${e.target.value}`;
                      setFormData(prev => ({ ...prev, designTools: tools }));
                    }
                  }}
                />
              )}
              {errors.designTools && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <FaExclamationTriangle className="text-xs" />
                  {errors.designTools}
                </p>
              )}
            </div>

            {/* Video Experience */}
            <div>
              <label className="block text-sm font-semibold text-[#0b2735] mb-2">
                <FaVideo className="inline mr-2 text-[#efb291]" />
                Do you have experience with video design or motion graphics? <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="videoExperience"
                    value="Yes"
                    checked={formData.videoExperience === "Yes"}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#efb291] border-gray-300 focus:ring-[#efb291]"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="videoExperience"
                    value="No"
                    checked={formData.videoExperience === "No"}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#efb291] border-gray-300 focus:ring-[#efb291]"
                  />
                  <span>No</span>
                </label>
              </div>
              {errors.videoExperience && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <FaExclamationTriangle className="text-xs" />
                  {errors.videoExperience}
                </p>
              )}
            </div>

            {/* Work Availability */}
            <div>
              <label className="block text-sm font-semibold text-[#0b2735] mb-2">
                <FaClock className="inline mr-2 text-[#efb291]" />
                Work Availability <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">Are you available to work Monday–Friday, 9:00 AM – 5:00 PM (Kigali time)?</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="workAvailability"
                    value="Yes"
                    checked={formData.workAvailability === "Yes"}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#efb291] border-gray-300 focus:ring-[#efb291]"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="workAvailability"
                    value="No"
                    checked={formData.workAvailability === "No"}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#efb291] border-gray-300 focus:ring-[#efb291]"
                  />
                  <span>No</span>
                </label>
              </div>
              {errors.workAvailability && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <FaExclamationTriangle className="text-xs" />
                  {errors.workAvailability}
                </p>
              )}
            </div>

            {/* Contract Confirmation */}
            <div>
              <label className="block text-sm font-semibold text-[#0b2735] mb-2">
                <FaCheck className="inline mr-2 text-[#efb291]" />
                Contract Requirement Confirmation <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">Are you able to physically sign a contract in Kigali if selected?</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="contractConfirmation"
                    value="Yes"
                    checked={formData.contractConfirmation === "Yes"}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#efb291] border-gray-300 focus:ring-[#efb291]"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="contractConfirmation"
                    value="No"
                    checked={formData.contractConfirmation === "No"}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#efb291] border-gray-300 focus:ring-[#efb291]"
                  />
                  <span>No</span>
                </label>
              </div>
              {errors.contractConfirmation && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <FaExclamationTriangle className="text-xs" />
                  {errors.contractConfirmation}
                </p>
              )}
            </div>

            {/* Technical Readiness */}
            <div>
              <label className="block text-sm font-semibold text-[#0b2735] mb-2">
                <FaCheck className="inline mr-2 text-[#efb291]" />
                Technical Readiness <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-3">Do you have a reliable internet connection and a suitable laptop for full-time remote work?</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="technicalReadiness"
                    value="Yes"
                    checked={formData.technicalReadiness === "Yes"}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#efb291] border-gray-300 focus:ring-[#efb291]"
                  />
                  <span>Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="technicalReadiness"
                    value="No"
                    checked={formData.technicalReadiness === "No"}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#efb291] border-gray-300 focus:ring-[#efb291]"
                  />
                  <span>No</span>
                </label>
              </div>
              {errors.technicalReadiness && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <FaExclamationTriangle className="text-xs" />
                  {errors.technicalReadiness}
                </p>
              )}
            </div>

            {/* Resume Upload */}
            <div>
              <label htmlFor="resume" className="block text-sm font-semibold text-[#0b2735] mb-2">
                <FaFilePdf className="inline mr-2 text-[#efb291]" />
                Resume (PDF Format) <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                <label
                  htmlFor="resume"
                  className={`flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                    resumeFileName 
                      ? "border-green-400 bg-green-50 hover:border-green-500" 
                      : errors.resume
                      ? "border-red-400 bg-red-50 hover:border-red-500"
                      : "border-gray-300 hover:border-[#efb291] hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="file"
                    id="resume"
                    name="resume"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <FaFilePdf className={`text-2xl ${resumeFileName ? "text-green-600" : "text-gray-400"}`} />
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${resumeFileName ? "text-green-700" : "text-gray-600"}`}>
                      {resumeFileName || "Click to upload PDF"}
                    </span>
                    {!resumeFileName && (
                      <span className="text-xs text-gray-500">Max 5MB</span>
                    )}
                  </div>
                </label>
                {resumeFileName && !errors.resume && (
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
                    <FaCheckCircle className="text-base" />
                    <span className="flex-1">
                      <strong>{resumeFileName}</strong> selected successfully
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setResume(null);
                        setResumeFileName("");
                        const fileInput = document.getElementById('resume');
                        if (fileInput) fileInput.value = '';
                        if (errors.resume) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.resume;
                            return newErrors;
                          });
                        }
                      }}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              {errors.resume && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                  <FaExclamationTriangle className="text-xs" />
                  {errors.resume}
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
                placeholder="Tell us why you want to join Zuba House, what motivates you, and how your skills align with this role."
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

            {/* Additional Info */}
            <div>
              <label htmlFor="additionalInfo" className="block text-sm font-semibold text-[#0b2735] mb-2">
                <FaInfoCircle className="inline mr-2 text-[#efb291]" />
                Additional Information (Optional)
              </label>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#efb291] transition-all resize-none"
                placeholder="Anything else you'd like us to know (availability start date, special skills, etc.)"
              />
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
                    <FaCheckCircle />
                    <span>Submit Application</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ApplyForm;
