import React from 'react';
import algoliasearch from 'algoliasearch/lite';
import {
  InstantSearch,
  SearchBox,
  Hits,
  RefinementList,
  Configure,
  Pagination,
  ClearRefinements,
  CurrentRefinements,
  useInstantSearch
} from 'react-instantsearch';
import { Link } from 'react-router-dom';
import './AlgoliaSearch.css';

// Initialize Algolia - Replace with your actual credentials
// For now, using placeholder values - user needs to add their Algolia credentials
const getSearchClient = () => {
  const appId = import.meta.env.VITE_ALGOLIA_APP_ID || 'YOUR_APP_ID';
  const apiKey = import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY || 'YOUR_SEARCH_API_KEY';
  
  // Return a mock client if not configured to prevent errors
  if (appId === 'YOUR_APP_ID' || apiKey === 'YOUR_SEARCH_API_KEY') {
    return {
      search: () => Promise.resolve({ results: [] }),
      searchForFacetValues: () => Promise.resolve([]),
      multipleQueries: () => Promise.resolve({ results: [] })
    };
  }
  
  return algoliasearch(appId, apiKey);
};

const searchClient = getSearchClient();

// Product Hit Component (each search result)
const ProductHit = ({ hit }) => (
  <Link 
    to={`/product/${hit.objectID || hit._id}`}
    className="search-result-item"
  >
    <img 
      src={hit.image || hit.images?.[0] || '/placeholder.png'} 
      alt={hit.name}
      className="search-result-image"
    />
    <div className="search-result-content">
      <h3 className="search-result-title">{hit.name}</h3>
      <p className="search-result-price">${hit.price || hit.oldPrice || '0.00'}</p>
      {hit.catName && (
        <p className="search-result-category">{hit.catName}</p>
      )}
      {hit.brand && (
        <p className="search-result-brand">{hit.brand}</p>
      )}
    </div>
  </Link>
);

// Custom SearchBox Component
const CustomSearchBox = () => (
  <div className="search-box-wrapper">
    <SearchBox
      placeholder="Search for African fashion, art, home décor..."
    />
  </div>
);

// Results component with empty state
const Results = ({ children }) => {
  const { results, indexUiState } = useInstantSearch();
  
  if (!results || results.nbHits === 0) {
    return (
      <div className="search-no-results">
        <p>No products found for "{indexUiState.query || ''}".</p>
        <p>Try adjusting your search or filters.</p>
      </div>
    );
  }
  return <>{children}</>;
};

const AlgoliaSearch = () => {
  // Check if Algolia is configured
  const isConfigured = 
    import.meta.env.VITE_ALGOLIA_APP_ID && 
    import.meta.env.VITE_ALGOLIA_APP_ID !== 'YOUR_APP_ID' &&
    import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY &&
    import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY !== 'YOUR_SEARCH_API_KEY';

  if (!isConfigured) {
    return (
      <div style={{ 
        backgroundColor: '#0b2735', 
        minHeight: '100vh', 
        padding: '40px 20px',
        color: '#e5e2db',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: '#efb291', marginBottom: '20px' }}>Algolia Search Not Configured</h2>
          <p style={{ marginBottom: '20px', opacity: 0.9 }}>
            To enable advanced search, please configure Algolia credentials:
          </p>
          <ol style={{ textAlign: 'left', marginBottom: '20px', lineHeight: '2' }}>
            <li>Create a free Algolia account at <a href="https://www.algolia.com" target="_blank" rel="noopener noreferrer" style={{ color: '#efb291' }}>algolia.com</a></li>
            <li>Create a new application</li>
            <li>Get your Application ID and Search-Only API Key</li>
            <li>Add them to your <code style={{ backgroundColor: '#1a3d52', padding: '2px 6px', borderRadius: '4px' }}>.env</code> file:</li>
          </ol>
          <div style={{ 
            backgroundColor: '#1a3d52', 
            padding: '20px', 
            borderRadius: '8px',
            textAlign: 'left',
            marginBottom: '20px'
          }}>
            <code style={{ color: '#efb291' }}>
              REACT_APP_ALGOLIA_APP_ID=your_app_id<br/>
              REACT_APP_ALGOLIA_SEARCH_API_KEY=your_search_key
            </code>
          </div>
          <p style={{ opacity: 0.8, fontSize: '14px' }}>
            The search will fall back to the standard search until Algolia is configured.
          </p>
        </div>
      </div>
    );
  }

  return (
    <InstantSearch 
      indexName={import.meta.env.VITE_ALGOLIA_INDEX_NAME || "products"} 
      searchClient={searchClient}
    >
      <Configure hitsPerPage={20} />
      
      <div style={{ backgroundColor: '#0b2735', minHeight: '100vh', padding: '20px' }}>
        <div className="max-w-7xl mx-auto">
          {/* Search Header */}
          <div className="mb-8">
            <CustomSearchBox />
          </div>

          {/* Current Filters */}
          <div className="mb-4">
            <CurrentRefinements />
          </div>

          {/* Main Layout: Filters + Results */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Filters */}
            <div className="lg:col-span-1">
              <div 
                className="p-6 rounded-xl sticky top-20"
                style={{ backgroundColor: '#1a3d52', border: '1px solid rgba(239, 178, 145, 0.2)' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold" style={{ color: '#e5e2db' }}>
                    Filters
                  </h3>
                  <ClearRefinements />
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-3" style={{ color: '#efb291' }}>
                    Category
                  </h4>
                  <RefinementList
                    attribute="catName"
                    limit={10}
                    showMore={true}
                    showMoreLimit={20}
                  />
                </div>

                {/* Subcategory Filter */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-3" style={{ color: '#efb291' }}>
                    Subcategory
                  </h4>
                  <RefinementList
                    attribute="subCat"
                    limit={8}
                    showMore={true}
                  />
                </div>

                {/* Brand Filter */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-3" style={{ color: '#efb291' }}>
                    Brand
                  </h4>
                  <RefinementList
                    attribute="brand"
                    limit={5}
                    showMore={true}
                  />
                </div>
              </div>
            </div>

            {/* Right Side - Search Results */}
            <div className="lg:col-span-3">
              <Results>
                <Hits hitComponent={ProductHit} />
              </Results>
              
              {/* Pagination */}
              <div className="mt-8">
                <Pagination
                  showFirst={false}
                  showLast={false}
                  padding={2}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </InstantSearch>
  );
};

export default AlgoliaSearch;

