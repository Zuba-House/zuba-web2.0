import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import { fetchDataFromApi } from '../../utils/api';
import CircularProgress from '@mui/material/CircularProgress';

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Fetch blog data
      fetchDataFromApi(`/api/blog/${id}`)
      .then((res) => {
        // Handle different response formats
        if (res?.error === false && res?.blog) {
          setBlog(res.blog);
        } else if (res?._id) {
          setBlog(res);
        } else if (res?.error === false && res?._id) {
          setBlog(res);
        } else {
          setError('Blog post not found');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching blog:', err);
        setError('Blog post not found');
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="flex items-center justify-center">
          <CircularProgress />
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h2 className="text-2xl mb-4 text-[#0b2735]">Blog post not found</h2>
          <button 
            onClick={() => navigate('/')}
            className="bg-[#0b2735] text-white px-6 py-2 rounded hover:bg-[#1a3d52] transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-detail-page min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#0b2735] text-white py-8">
        <div className="container mx-auto px-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mb-4 hover:text-[#efb291] transition"
          >
            <IoArrowBack /> Back
          </button>
          <h1 className="text-3xl lg:text-4xl font-bold">{blog.title}</h1>
          {blog.createdAt && (
            <p className="text-gray-300 mt-2">
              {new Date(blog.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Featured Image */}
          {blog.images && blog.images.length > 0 && (
            <img 
              src={blog.images[0]} 
              alt={blog.title}
              className="w-full h-[400px] object-cover rounded-lg mb-8"
            />
          )}

          {/* Blog Content */}
          <div 
            className="blog-content prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: blog.description }}
          />

          {/* Author/Meta Info */}
          {blog.author && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-gray-600">
                <strong>Author:</strong> {blog.author}
              </p>
            </div>
          )}

          {/* Back Button */}
          <div className="mt-12">
            <button 
              onClick={() => navigate('/')}
              className="bg-[#0b2735] text-white px-8 py-3 rounded hover:bg-[#1a3d52] transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;

