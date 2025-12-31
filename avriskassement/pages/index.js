import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, RefreshCw, Calendar, DollarSign, User } from 'lucide-react';

// Version tracking
const VERSION = "3.0.3-FIXED";

export default function RiskManagementPortal() {
  const [view, setView] = useState('dashboard');
  const [opportunities, setOpportunities] = useState([]);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [lastRefresh, setLastRefresh] = useState(null);
  const [dateFilter, setDateFilter] = useState('30'); // '30', '60', '90', 'all', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  // Workflow filters
  const [reviewedFilter, setReviewedFilter] = useState('all'); // 'all', 'reviewed', 'not_reviewed'
  const [mitigationFilter, setMitigationFilter] = useState('all'); // 'all', 'none', 'partial', 'complete', 'incomplete'
  const [apiConfig, setApiConfig] = useState({
    subdomain: '',
    authToken: '',
    configured: false
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 50;

  /**
   * Helper function to call the server-side API route
   * This replaces direct Current RMS API calls
   */
  const callCurrentRMS = async (endpoint, method = 'GET', body = null) => {
    const response = await fetch('/api/current-rms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        endpoint,
        method,
        body
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API call failed');
    }

    return await response.json();
  };

  // Calculate date ranges for filtering
  const getDateRange = (filterType) => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    switch(filterType) {
      case '30':
        return {
          start: startOfToday,
          end: new Date(startOfToday.getTime() + (30 * 24 * 60 * 60 * 1000))
        };
      case '60':
        return {
          start: new Date(startOfToday.getTime() + (30 * 24 * 60 * 60 * 1000)),
          end: new Date(startOfToday.getTime() + (60 * 24 * 60 * 60 * 1000))
        };
      case '90':
        return {
          start: new Date(startOfToday.getTime() + (60 * 24 * 60 * 60 * 1000)),
          end: new Date(startOfToday.getTime() + (90 * 24 * 60 * 60 * 1000))
        };
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : null,
          end: customEndDate ? new Date(customEndDate) : null
        };
      default: // 'all'
        return { start: null, end: null };
    }
  };

  // Fetch opportunities from Current RMS API with pagination
  const fetchOpportunities = async (page = 1) => {
    setLoading(true);
    setLoadingProgress({ current: 0, total: 0 });
    
    try {
      // Calculate offset for pagination
      const offset = (page - 1) * ITEMS_PER_PAGE;
      
      // Fetch from API with pagination
      const data = await callCurrentRMS(
        `opportunities?page=${page}&per_page=${ITEMS_PER_PAGE}`,
        'GET'
      );

      console.log('API Response:', data);

      const opps = data.opportunities || [];
      setTotalCount(data.meta?.total_row_count || opps.length);
      setTotalPages(Math.ceil((data.meta?.total_row_count || opps.length) / ITEMS_PER_PAGE));
      
      // Process opportunities
      const processedOpps = opps.map(opp => ({
        ...opp,
        risk_score: Number(opp.risk_score) || 0,
        risk_mitigation_plan: Number(opp.risk_mitigation_plan) || 0,
        risk_reviewed: opp.risk_reviewed || '',
        starts_at: opp.starts_at || '',
        subject: opp.subject || 'Untitled Opportunity',
        charge: Number(opp.charge) || 0,
        opportunity_owner: opp.opportunity_owner || { name: 'Unassigned' }
      }));

      setOpportunities(processedOpps);
      setLastRefresh(new Date());
      
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      alert('Failed to load opportunities. Please check your API configuration.');
    } finally {
      setLoading(false);
    }
  };

  // Filter opportunities based on date, review status, and mitigation plan
  const getFilteredOpportunities = () => {
    const dateRange = getDateRange(dateFilter);
    
    return opportunities.filter(opp => {
      // Date filtering
      if (dateRange.start || dateRange.end) {
        const oppDate = new Date(opp.starts_at);
        if (dateRange.start && oppDate < dateRange.start) return false;
        if (dateRange.end && oppDate > dateRange.end) return false;
      }

      // ✅ FIXED: Handle Current RMS "Yes" format for reviewed status
      // Current RMS returns "Yes" or "" (empty string), not boolean
      const isReviewed = opp.risk_reviewed === 'Yes' || opp.risk_reviewed === true || 
                        opp.risk_reviewed === 'true' || opp.risk_reviewed === 1 || 
                        opp.risk_reviewed === '1';
      
      // Debug logging (can be removed after verification)
      if (showDebug) {
        console.log('Filtering opportunity:', {
          id: opp.id,
          subject: opp.subject,
          risk_reviewed_raw: opp.risk_reviewed,
          isReviewed_calculated: isReviewed,
          reviewedFilter: reviewedFilter
        });
      }

      // Reviewed status filtering
      if (reviewedFilter === 'reviewed' && !isReviewed) return false;
      if (reviewedFilter === 'not_reviewed' && isReviewed) return false;

      // Mitigation plan filtering
      const mitigationStatus = Number(opp.risk_mitigation_plan);
      if (mitigationFilter === 'none' && mitigationStatus !== 0) return false;
      if (mitigationFilter === 'partial' && mitigationStatus !== 1) return false;
      if (mitigationFilter === 'complete' && mitigationStatus !== 2) return false;
      if (mitigationFilter === 'incomplete' && (mitigationStatus === 0 || mitigationStatus === 2)) return false;

      return true;
    });
  };

  // Calculate statistics
  const calculateStats = (opps = opportunities) => {
    const filtered = getFilteredOpportunities();
    
    const criticalRisk = filtered.filter(o => o.risk_score > 4).length;
    const highRisk = filtered.filter(o => o.risk_score >= 3 && o.risk_score <= 4).length;
    const mediumRisk = filtered.filter(o => o.risk_score >= 2 && o.risk_score < 3).length;
    const lowRisk = filtered.filter(o => o.risk_score < 2).length;
    
    const needsReview = filtered.filter(o => {
      const isReviewed = o.risk_reviewed === 'Yes' || o.risk_reviewed === true || 
                        o.risk_reviewed === 'true' || o.risk_reviewed === 1 || 
                        o.risk_reviewed === '1';
      return !isReviewed;
    }).length;
    
    const needsMitigation = filtered.filter(o => {
      const plan = Number(o.risk_mitigation_plan);
      return o.risk_score >= 3 && (plan === 0 || plan === 1);
    }).length;
    
    const totalValue = filtered.reduce((sum, o) => sum + (Number(o.charge) || 0), 0);
    
    return {
      total: filtered.length,
      criticalRisk,
      highRisk,
      mediumRisk,
      lowRisk,
      needsReview,
      needsMitigation,
      totalValue
    };
  };

  const stats = calculateStats();

  // Initial load
  useEffect(() => {
    fetchOpportunities(1);
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, reviewedFilter, mitigationFilter, customStartDate, customEndDate]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getRiskLevel = (score) => {
    if (score > 4) return { label: 'CRITICAL', color: 'bg-purple-100 text-purple-800 border-purple-300' };
    if (score >= 3) return { label: 'HIGH', color: 'bg-red-100 text-red-800 border-red-300' };
    if (score >= 2) return { label: 'MEDIUM', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    return { label: 'LOW', color: 'bg-green-100 text-green-800 border-green-300' };
  };

  const getMitigationLabel = (status) => {
    switch(Number(status)) {
      case 0: return { label: 'None', color: 'bg-gray-100 text-gray-800' };
      case 1: return { label: 'Partial', color: 'bg-blue-100 text-blue-800' };
      case 2: return { label: 'Complete', color: 'bg-green-100 text-green-800' };
      default: return { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, onClick }) => (
    <div 
      onClick={onClick}
      className={`bg-white p-6 rounded-lg shadow-sm border-2 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600 text-sm font-medium">{title}</span>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
    </div>
  );

  const OpportunityCard = ({ opp }) => {
    const riskLevel = getRiskLevel(opp.risk_score);
    const mitigation = getMitigationLabel(opp.risk_mitigation_plan);
    const isReviewed = opp.risk_reviewed === 'Yes' || opp.risk_reviewed === true || 
                      opp.risk_reviewed === 'true' || opp.risk_reviewed === 1 || 
                      opp.risk_reviewed === '1';
    
    return (
      <div 
        onClick={() => {
          setSelectedOpp(opp);
          setView('assessment');
        }}
        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-1">{opp.subject}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(opp.starts_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span>{formatCurrency(opp.charge)}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{opp.opportunity_owner?.name || 'Unassigned'}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${riskLevel.color}`}>
              {riskLevel.label}
            </span>
            {isReviewed && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="w-3 h-3" />
                Reviewed
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Risk Score:</span>
            <span className="font-semibold text-gray-900">{opp.risk_score.toFixed(1)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Mitigation:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${mitigation.color}`}>
              {mitigation.label}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const Pagination = () => {
    const maxButtons = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    const handlePageChange = (newPage) => {
      setCurrentPage(newPage);
      fetchOpportunities(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-6 px-4">
        <div className="text-sm text-gray-600">
          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} opportunities
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
              >
                1
              </button>
              {startPage > 2 && <span className="px-2">...</span>}
            </>
          )}
          
          {pages.map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded border ${
                page === currentPage
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2">...</span>}
              <button
                onClick={() => handlePageChange(totalPages)}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
              >
                {totalPages}
              </button>
            </>
          )}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  if (view === 'dashboard') {
    const filteredOpps = getFilteredOpportunities();
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Risk Management Portal</h1>
                <p className="text-gray-600 mt-1">Monitor and assess opportunity risks</p>
                <p className="text-xs text-gray-400 mt-1">Version {VERSION}</p>
              </div>
              <div className="flex items-center gap-4">
                {lastRefresh && (
                  <span className="text-sm text-gray-500">
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </span>
                )}
                <button
                  onClick={() => fetchOpportunities(currentPage)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  {showDebug ? 'Hide' : 'Show'} Debug
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>
            
            {/* Date Range Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setDateFilter('30')}
                  className={`px-4 py-2 rounded-md text-sm ${
                    dateFilter === '30' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  0-30 Days
                </button>
                <button
                  onClick={() => setDateFilter('60')}
                  className={`px-4 py-2 rounded-md text-sm ${
                    dateFilter === '60' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  30-60 Days
                </button>
                <button
                  onClick={() => setDateFilter('90')}
                  className={`px-4 py-2 rounded-md text-sm ${
                    dateFilter === '90' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  60-90 Days
                </button>
                <button
                  onClick={() => setDateFilter('all')}
                  className={`px-4 py-2 rounded-md text-sm ${
                    dateFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Dates
                </button>
                <button
                  onClick={() => setDateFilter('custom')}
                  className={`px-4 py-2 rounded-md text-sm ${
                    dateFilter === 'custom' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Custom Range
                </button>
              </div>
              
              {dateFilter === 'custom' && (
                <div className="flex gap-4 mt-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Workflow Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Reviewed Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Review Status</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReviewedFilter('all')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm ${
                      reviewedFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setReviewedFilter('reviewed')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm ${
                      reviewedFilter === 'reviewed' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Reviewed
                  </button>
                  <button
                    onClick={() => setReviewedFilter('not_reviewed')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm ${
                      reviewedFilter === 'not_reviewed' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Not Reviewed
                  </button>
                </div>
              </div>

              {/* Mitigation Plan Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mitigation Plan</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMitigationFilter('all')}
                    className={`flex-1 px-3 py-2 rounded-md text-sm ${
                      mitigationFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setMitigationFilter('none')}
                    className={`flex-1 px-3 py-2 rounded-md text-sm ${
                      mitigationFilter === 'none' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    None
                  </button>
                  <button
                    onClick={() => setMitigationFilter('partial')}
                    className={`flex-1 px-3 py-2 rounded-md text-sm ${
                      mitigationFilter === 'partial' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Partial
                  </button>
                  <button
                    onClick={() => setMitigationFilter('complete')}
                    className={`flex-1 px-3 py-2 rounded-md text-sm ${
                      mitigationFilter === 'complete' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => setMitigationFilter('incomplete')}
                    className={`flex-1 px-3 py-2 rounded-md text-sm ${
                      mitigationFilter === 'incomplete' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Incomplete
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard 
              title="Total Opportunities" 
              value={stats.total}
              icon={Calendar}
              color="text-blue-500"
            />
            <StatCard 
              title="Critical Risk" 
              value={stats.criticalRisk}
              icon={AlertCircle}
              color="text-purple-500"
              onClick={() => setSelectedCategory('critical')}
            />
            <StatCard 
              title="Needs Review" 
              value={stats.needsReview}
              icon={AlertTriangle}
              color="text-orange-500"
              onClick={() => setReviewedFilter('not_reviewed')}
            />
            <StatCard 
              title="Needs Mitigation" 
              value={stats.needsMitigation}
              icon={AlertCircle}
              color="text-red-500"
              onClick={() => setMitigationFilter('incomplete')}
            />
          </div>

          {/* Risk Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Risk Distribution</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.criticalRisk}</div>
                <div className="text-sm text-gray-600">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.highRisk}</div>
                <div className="text-sm text-gray-600">High</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.mediumRisk}</div>
                <div className="text-sm text-gray-600">Medium</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.lowRisk}</div>
                <div className="text-sm text-gray-600">Low</div>
              </div>
            </div>
          </div>

          {/* Debug Info */}
          {showDebug && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
              <h3 className="font-semibold text-yellow-900 mb-2">Debug Information</h3>
              <div className="text-sm text-yellow-800 space-y-1">
                <div>Version: {VERSION}</div>
                <div>Total Opportunities Loaded: {opportunities.length}</div>
                <div>Filtered Opportunities: {filteredOpps.length}</div>
                <div>Current Page: {currentPage} of {totalPages}</div>
                <div>Review Filter: {reviewedFilter}</div>
                <div>Mitigation Filter: {mitigationFilter}</div>
                <div className="mt-2 pt-2 border-t border-yellow-300">
                  <div className="font-semibold">Sample Data (first opportunity):</div>
                  {opportunities.length > 0 && (
                    <pre className="text-xs mt-1 overflow-auto">
                      {JSON.stringify({
                        risk_reviewed: opportunities[0].risk_reviewed,
                        risk_score: opportunities[0].risk_score,
                        risk_mitigation_plan: opportunities[0].risk_mitigation_plan
                      }, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Opportunities List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Opportunities ({filteredOpps.length})
              </h2>
            </div>
            
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-gray-600">Loading opportunities...</p>
              </div>
            ) : filteredOpps.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No opportunities match the current filters</p>
              </div>
            ) : (
              <div className="p-6">
                <div className="space-y-4">
                  {filteredOpps.map(opp => (
                    <OpportunityCard key={opp.id} opp={opp} />
                  ))}
                </div>
                <Pagination />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'assessment') {
    return (
      <RiskAssessment
        opportunity={selectedOpp}
        onBack={() => {
          setView('dashboard');
          setSelectedOpp(null);
        }}
        onSave={async (updatedData) => {
          try {
            // ✅ FIXED: Use "Yes"/"" format for Current RMS
            const payload = {
              opportunity: {
                risk_score: updatedData.score,
                risk_mitigation_plan: updatedData.mitigation,
                risk_reviewed: updatedData.reviewed ? 'Yes' : '',
                risk_notes: updatedData.notes || ''
              }
            };

            await callCurrentRMS(`opportunities/${selectedOpp.id}`, 'PATCH', payload);
            
            // Refresh data
            await fetchOpportunities(currentPage);
            setView('dashboard');
            setSelectedOpp(null);
          } catch (error) {
            console.error('Error saving assessment:', error);
            throw error;
          }
        }}
        callCurrentRMS={callCurrentRMS}
      />
    );
  }

  return null;
}

// Risk Assessment Component
function RiskAssessment({ opportunity, onBack, onSave, callCurrentRMS }) {
  const [impact, setImpact] = useState(1);
  const [likelihood, setLikelihood] = useState(1);
  const [mitigation, setMitigation] = useState(opportunity?.risk_mitigation_plan || 0);
  const [reviewed, setReviewed] = useState(
    opportunity?.risk_reviewed === 'Yes' || 
    opportunity?.risk_reviewed === true || 
    opportunity?.risk_reviewed === 'true' ||
    opportunity?.risk_reviewed === 1 ||
    opportunity?.risk_reviewed === '1'
  );
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Initialize from existing score
  useEffect(() => {
    if (opportunity?.risk_score) {
      const score = opportunity.risk_score;
      // Estimate impact and likelihood from score (assuming they were roughly equal)
      const estimated = Math.sqrt(score);
      setImpact(Math.round(estimated));
      setLikelihood(Math.round(estimated));
    }
  }, [opportunity]);

  const score = impact * likelihood;
  const riskLevel = score > 4 ? 'CRITICAL' : score >= 3 ? 'HIGH' : score >= 2 ? 'MEDIUM' : 'LOW';
  const riskColor = score > 4 ? 'text-purple-600' : score >= 3 ? 'text-red-600' : score >= 2 ? 'text-yellow-600' : 'text-green-600';

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        score,
        mitigation,
        reviewed,
        notes
      });
    } catch (error) {
      alert('Failed to save assessment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={onBack}
            className="text-blue-500 hover:text-blue-600 mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Risk Assessment</h1>
          <p className="text-gray-600 mt-1">{opportunity?.subject}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Opportunity Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Opportunity Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Event Date:</span>
              <p className="font-medium">{new Date(opportunity?.starts_at).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Value:</span>
              <p className="font-medium">${(opportunity?.charge || 0).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Owner:</span>
              <p className="font-medium">{opportunity?.opportunity_owner?.name || 'Unassigned'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Current Risk Score:</span>
              <p className="font-medium">{opportunity?.risk_score?.toFixed(1) || 'Not assessed'}</p>
            </div>
          </div>
        </div>

        {/* Risk Matrix */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Risk Assessment Matrix</h2>
          
          {/* Impact Scale */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Impact (1-5)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  onClick={() => setImpact(value)}
                  className={`flex-1 py-3 rounded-md font-medium transition-colors ${
                    impact === value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              1 = Minimal impact, 5 = Severe impact
            </p>
          </div>

          {/* Likelihood Scale */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Likelihood (1-5)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  onClick={() => setLikelihood(value)}
                  className={`flex-1 py-3 rounded-md font-medium transition-colors ${
                    likelihood === value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              1 = Very unlikely, 5 = Very likely
            </p>
          </div>

          {/* Calculated Risk Score */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Calculated Risk Score:</span>
              <div className="text-right">
                <span className={`text-3xl font-bold ${riskColor}`}>{score.toFixed(1)}</span>
                <span className={`ml-3 text-sm font-semibold ${riskColor}`}>{riskLevel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mitigation Plan */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Mitigation Plan Status</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setMitigation(0)}
              className={`flex-1 py-3 rounded-md font-medium transition-colors ${
                mitigation === 0
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              None
            </button>
            <button
              onClick={() => setMitigation(1)}
              className={`flex-1 py-3 rounded-md font-medium transition-colors ${
                mitigation === 1
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Partial
            </button>
            <button
              onClick={() => setMitigation(2)}
              className={`flex-1 py-3 rounded-md font-medium transition-colors ${
                mitigation === 2
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Complete
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Assessment Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this risk assessment..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
        </div>

        {/* Review Checkbox */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={reviewed}
              onChange={(e) => setReviewed(e.target.checked)}
              className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="font-medium text-gray-900">Mark as reviewed</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving...' : 'Save Assessment'}
          </button>
          <button
            onClick={onBack}
            disabled={saving}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
