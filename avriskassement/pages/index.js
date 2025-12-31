import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, RefreshCw, Calendar, DollarSign, User } from 'lucide-react';

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

  // Mock data for demonstration
  const mockOpportunities = [
    { id: 1001, name: 'Corporate Event - Tech Summit 2026', subject: 'Conference AV', value: 45000, estimated_cost: 32000, owner: 'Sarah M.', starts_at: '2026-02-15', contact_name: 'John Smith', risk_score: 4.2, risk_level: 'CRITICAL', risk_project_novelty: 4, risk_technical_complexity: 5, risk_resource_utilization: 4, risk_client_sophistication: 3, risk_budget_size: 4, risk_timeframe_constraint: 5, risk_team_experience: 4, risk_subhire_availability: 3, risk_reviewed: true, risk_mitigation_plan: 1, risk_last_updated: '2025-12-20T14:30:00Z', risk_mitigation_notes: 'Additional technical crew on standby. Backup equipment arranged with local supplier.' },
    { id: 1002, name: 'Wedding Reception - Grand Hotel', subject: 'Wedding', value: 8500, estimated_cost: 5200, owner: 'Mike T.', starts_at: '2026-01-20', contact_name: 'Sarah Johnson', risk_score: 2.1, risk_level: 'MEDIUM', risk_project_novelty: 2, risk_technical_complexity: 2, risk_resource_utilization: 2, risk_client_sophistication: 3, risk_budget_size: 2, risk_timeframe_constraint: 2, risk_team_experience: 2, risk_subhire_availability: 2, risk_reviewed: true, risk_mitigation_plan: 2, risk_last_updated: '2025-12-18T10:15:00Z', risk_mitigation_notes: 'Standard wedding package. Experienced team assigned. All contingencies covered.' },
    { id: 1003, name: 'Product Launch - Stadium Event', subject: 'Product Launch', value: 95000, estimated_cost: 68000, owner: 'Sarah M.', starts_at: '2026-03-10', contact_name: 'Mike Chen', risk_score: 4.8, risk_level: 'CRITICAL', risk_project_novelty: 5, risk_technical_complexity: 5, risk_resource_utilization: 5, risk_client_sophistication: 4, risk_budget_size: 5, risk_timeframe_constraint: 5, risk_team_experience: 4, risk_subhire_availability: 5, risk_reviewed: true, risk_mitigation_plan: 0, risk_last_updated: '2025-12-22T16:45:00Z', risk_mitigation_notes: '' },
    { id: 1004, name: 'Corporate Training Day', subject: 'Corporate', value: 3200, estimated_cost: 1800, owner: 'John D.', starts_at: '2026-01-25', contact_name: 'Emma Wilson', risk_score: 1.5, risk_level: 'LOW', risk_project_novelty: 1, risk_technical_complexity: 1, risk_resource_utilization: 1, risk_client_sophistication: 2, risk_budget_size: 1, risk_timeframe_constraint: 2, risk_team_experience: 1, risk_subhire_availability: 1, risk_reviewed: true, risk_mitigation_plan: 2, risk_last_updated: '2025-12-15T09:00:00Z', risk_mitigation_notes: 'Low risk event. Standard setup with experienced team.' },
    { id: 1005, name: 'Music Festival Main Stage', subject: 'Festival', value: 125000, estimated_cost: 89000, owner: 'Sarah M.', starts_at: '2026-04-05', contact_name: 'David Lee', risk_score: 3.8, risk_level: 'HIGH', risk_project_novelty: 4, risk_technical_complexity: 4, risk_resource_utilization: 4, risk_client_sophistication: 3, risk_budget_size: 5, risk_timeframe_constraint: 4, risk_team_experience: 3, risk_subhire_availability: 3, risk_reviewed: false, risk_mitigation_plan: 0, risk_last_updated: null, risk_mitigation_notes: '' },
    { id: 1006, name: 'AGM - Convention Center', subject: 'AGM', value: 12000, estimated_cost: 7500, owner: 'Mike T.', starts_at: '2026-02-01', contact_name: 'Lisa Brown', risk_score: 1.8, risk_level: 'LOW', risk_project_novelty: 1, risk_technical_complexity: 2, risk_resource_utilization: 2, risk_client_sophistication: 2, risk_budget_size: 2, risk_timeframe_constraint: 2, risk_team_experience: 1, risk_subhire_availability: 2, risk_reviewed: true, risk_mitigation_plan: 2, risk_last_updated: '2025-12-19T11:30:00Z', risk_mitigation_notes: 'Routine AGM setup. Client familiar with our services.' },
    { id: 1007, name: 'Trade Show Booth', subject: 'Trade Show', value: 6500, estimated_cost: 4200, owner: 'John D.', starts_at: '2026-01-30', contact_name: 'Tom Anderson', risk_score: 2.8, risk_level: 'MEDIUM', risk_project_novelty: 3, risk_technical_complexity: 3, risk_resource_utilization: 3, risk_client_sophistication: 3, risk_budget_size: 2, risk_timeframe_constraint: 3, risk_team_experience: 2, risk_subhire_availability: 3, risk_reviewed: false, risk_mitigation_plan: 0, risk_last_updated: null, risk_mitigation_notes: '' },
    { id: 1008, name: 'Live Broadcast - Sports Arena', subject: 'Broadcast', value: 78000, estimated_cost: 55000, owner: 'Sarah M.', starts_at: '2026-02-20', contact_name: 'Rachel Green', risk_score: 4.5, risk_level: 'CRITICAL', risk_project_novelty: 5, risk_technical_complexity: 5, risk_resource_utilization: 4, risk_client_sophistication: 4, risk_budget_size: 5, risk_timeframe_constraint: 4, risk_team_experience: 4, risk_subhire_availability: 4, risk_reviewed: true, risk_mitigation_plan: 1, risk_last_updated: '2025-12-21T13:20:00Z', risk_mitigation_notes: 'Broadcast specialist confirmed. Redundant transmission equipment arranged. Weather contingency in place.' },
    { id: 1009, name: 'New Client Consultation', subject: 'Consultation', value: 15000, estimated_cost: 9000, owner: 'John D.', starts_at: '2026-01-28', contact_name: 'Peter Wang', risk_score: 0, risk_level: null, risk_project_novelty: 0, risk_technical_complexity: 0, risk_resource_utilization: 0, risk_client_sophistication: 0, risk_budget_size: 0, risk_timeframe_constraint: 0, risk_team_experience: 0, risk_subhire_availability: 0, risk_reviewed: false, risk_mitigation_plan: 0, risk_last_updated: null, risk_mitigation_notes: '' },
    { id: 1010, name: 'Charity Gala Evening', subject: 'Gala', value: 22000, estimated_cost: 14000, owner: 'Mike T.', starts_at: '2026-02-10', contact_name: 'Jane Smith', risk_score: 0, risk_level: null, risk_project_novelty: 0, risk_technical_complexity: 0, risk_resource_utilization: 0, risk_client_sophistication: 0, risk_budget_size: 0, risk_timeframe_constraint: 0, risk_team_experience: 0, risk_subhire_availability: 0, risk_reviewed: false, risk_mitigation_plan: 0, risk_last_updated: null, risk_mitigation_notes: '' }
  ];

  useEffect(() => {
    // Automatically load opportunities on mount (uses server-side credentials)
    loadOpportunities();
  }, []);

  // Removed saveApiConfig - using server-side credentials

  /**
   * Fetch all opportunities with pagination support
   */
  const loadOpportunities = async (config) => {
    setLoading(true);
    setLoadingProgress({ current: 0, total: 0 });
    
    try {
      // Always use server-side API (no config check needed)
      // Calculate date range for API filtering
      const { start, end } = getDateRange();
      // Format dates in local timezone (not UTC) to avoid timezone shift issues
      const startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      const endDate = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
      
      console.log(`Fetching opportunities from ${startDate} to ${endDate}`);
      console.log('Fetching from Current RMS API with pagination and date filtering...');
      
      const allOpportunities = [];
      let currentPage = 1;
      let totalPages = 1;
      
      // Fetch all pages
      while (currentPage <= totalPages) {
        console.log(`Fetching page ${currentPage}/${totalPages || '?'}...`);
        setLoadingProgress({ current: currentPage, total: totalPages });
        
        // Build endpoint with date filtering using Current RMS predicates
        const endpoint = `opportunities?` +
          `q[starts_at_gteq]=${startDate}&` +
          `q[starts_at_lteq]=${endDate}&` +
          `page=${currentPage}&per_page=25`;
        
        console.log('Fetching endpoint:', endpoint);
        
        const data = await callCurrentRMS(endpoint, 'GET');
        
        console.log(`Page ${currentPage} response received`);
        
        // DETAILED LOGGING FOR DEBUGGING
        console.log('=== FULL API RESPONSE ===');
        console.log('Response keys:', Object.keys(data));
        console.log('Full response:', JSON.stringify(data, null, 2));
        
        // Check if data has opportunities array
        if (!data.opportunities || !Array.isArray(data.opportunities)) {
          console.error('Unexpected API response structure:', data);
          throw new Error('Invalid API response structure');
        }
        
        // Add opportunities from this page
        allOpportunities.push(...data.opportunities);
        console.log(`Added ${data.opportunities.length} opportunities from page ${currentPage}. Total so far: ${allOpportunities.length}`);
        
        // DETAILED PAGINATION METADATA LOGGING
        console.log('=== PAGINATION INFO ===');
        console.log('data.meta:', data.meta);
          
          // Current RMS returns pagination in meta field
          if (data.meta) {
            const totalRowCount = data.meta.total_row_count;
            const perPage = data.meta.per_page || 25;
            const currentPageNum = data.meta.page;
            
            console.log(`Total records in date range: ${totalRowCount}`);
            console.log(`Per page: ${perPage}`);
            console.log(`Current page: ${currentPageNum}`);
            console.log(`Records in this response: ${data.meta.row_count}`);
            
            // Calculate total pages
            if (totalRowCount && perPage) {
              totalPages = Math.ceil(totalRowCount / perPage);
              console.log(`✓ Calculated total pages: ${totalPages} (${totalRowCount} records / ${perPage} per page)`);
            }
          }
          
          // Check if we're done
          if (data.opportunities.length === 0) {
            console.log('No more results, stopping pagination');
            break;
          }
          
          if (currentPage >= totalPages) {
            console.log(`Reached last page (${currentPage}/${totalPages})`);
            break;
          }
          
          currentPage++;
          
          // Safety check to prevent infinite loops
          if (currentPage > 1000) {
            console.warn('Safety limit reached: stopping at page 1000');
            break;
          }
        }
        
        console.log(`Finished fetching. Total opportunities: ${allOpportunities.length}`);
        
        // Transform Current RMS data to our format
        const transformedOpps = allOpportunities.map(opp => ({
          id: opp.id,
          name: opp.subject || 'Untitled Opportunity',
          subject: opp.subject,
          value: parseFloat(opp.charge_total) || 0,
          estimated_cost: parseFloat(opp.cost_total) || 0,
          owner: opp.owner?.name || 'Unassigned',
          starts_at: opp.starts_at,
          contact_name: opp.organisation?.name || 'No contact',
          risk_score: parseFloat(opp.custom_fields?.risk_score || 0),
          risk_level: opp.custom_fields?.risk_level || null,
          // Individual risk factor scores
          risk_project_novelty: parseInt(opp.custom_fields?.risk_project_novelty || 0),
          risk_technical_complexity: parseInt(opp.custom_fields?.risk_technical_complexity || 0),
          risk_resource_utilization: parseInt(opp.custom_fields?.risk_resource_utilization || 0),
          risk_client_sophistication: parseInt(opp.custom_fields?.risk_client_sophistication || 0),
          risk_budget_size: parseInt(opp.custom_fields?.risk_budget_size || 0),
          risk_timeframe_constraint: parseInt(opp.custom_fields?.risk_timeframe_constraint || 0),
          risk_team_experience: parseInt(opp.custom_fields?.risk_team_experience || 0),
          risk_subhire_availability: parseInt(opp.custom_fields?.risk_subhire_availability || 0),
          // Workflow tracking
          risk_reviewed: opp.custom_fields?.risk_reviewed === 'Yes' || 
                        opp.custom_fields?.risk_reviewed === 'true' || 
                        opp.custom_fields?.risk_reviewed === true || 
                        opp.custom_fields?.risk_reviewed === 1 ||
                        opp.custom_fields?.risk_reviewed === '1',
          risk_mitigation_plan: parseInt(opp.custom_fields?.risk_mitigation_plan || 0), // 0=none, 1=partial, 2=complete
          risk_last_updated: opp.custom_fields?.risk_last_updated || null,
          risk_mitigation_notes: opp.custom_fields?.risk_mitigation_notes || ''
        }));
        
        console.log('Transformed opportunities:', transformedOpps.length);
        setOpportunities(transformedOpps);
        setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading opportunities:', error);
      alert(`Error connecting to Current RMS: ${error.message}\n\nUsing demo data instead.\n\nCheck browser console for details.`);
      setOpportunities(mockOpportunities);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
      setLoadingProgress({ current: 0, total: 0 });
    }
  };

  const handleDateFilterChange = (newFilter) => {
    setDateFilter(newFilter);
    // Reload opportunities with new date filter
    loadOpportunities();
  };

  const handleCustomDateChange = () => {
    // Reload opportunities when custom dates are applied
    if (customStartDate && customEndDate) {
      loadOpportunities();
    }
  };

  const getRiskIcon = (level) => {
    switch(level) {
      case 'LOW': return CheckCircle;
      case 'MEDIUM': return AlertTriangle;
      case 'HIGH': return AlertCircle;
      case 'CRITICAL': return AlertCircle;
      default: return AlertCircle;
    }
  };

  const getRiskColor = (level) => {
    switch(level) {
      case 'LOW': return 'bg-green-100 text-green-800 border-green-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-300';
      case 'UNSCORED': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const categorizedOpps = {
    CRITICAL: opportunities.filter(o => o.risk_level === 'CRITICAL'),
    HIGH: opportunities.filter(o => o.risk_level === 'HIGH'),
    MEDIUM: opportunities.filter(o => o.risk_level === 'MEDIUM'),
    LOW: opportunities.filter(o => o.risk_level === 'LOW'),
    UNASSESSED: opportunities.filter(o => !o.risk_level)
  };

  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);
  const highRiskValue = [...categorizedOpps.CRITICAL, ...categorizedOpps.HIGH].reduce((sum, opp) => sum + (opp.value || 0), 0);

  const getDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const start = new Date(today);
    let end = new Date(today);
    
    if (dateFilter === 'all') {
      // Show all opportunities from today forward
      return {
        start: today,
        end: new Date('2099-12-31')
      };
    }
    
    if (dateFilter === 'custom') {
      if (customStartDate && customEndDate) {
        return {
          start: new Date(customStartDate),
          end: new Date(customEndDate)
        };
      }
      // Default to next 30 days if custom not set
      end.setDate(end.getDate() + 30);
      return { start: today, end };
    }
    
    // For 30, 60, 90 day filters - show ranges 0-30, 30-60, 60-90
    const days = parseInt(dateFilter);
    if (days === 30) {
      // 0-30 days from today
      end.setDate(end.getDate() + 30);
      return { start: today, end };
    } else if (days === 60) {
      // 30-60 days from today
      start.setDate(start.getDate() + 30);
      end.setDate(end.getDate() + 60);
      return { start, end };
    } else if (days === 90) {
      // 60-90 days from today
      start.setDate(start.getDate() + 60);
      end.setDate(end.getDate() + 90);
      return { start, end };
    }
    
    // Fallback (shouldn't reach here)
    end.setDate(end.getDate() + days);
    return { start: today, end };
  };
  
  // No need for client-side date filtering anymore - the API returns pre-filtered data by date
  // But we still apply workflow filters client-side
  const oppsWithCalculatedLevels = opportunities.map(opp => {
    let calculatedLevel = null;
    if (opp.risk_score > 0) {
      if (opp.risk_score <= 2.0) calculatedLevel = 'LOW';
      else if (opp.risk_score <= 3.0) calculatedLevel = 'MEDIUM';
      else if (opp.risk_score <= 4.0) calculatedLevel = 'HIGH';
      else calculatedLevel = 'CRITICAL';
    }
    return { ...opp, risk_level: calculatedLevel };
  });

  // Apply workflow filters
  const workflowFilteredOpps = oppsWithCalculatedLevels.filter(opp => {
    // Review filter - Current RMS returns "Yes" or empty string ""
    const isReviewed = opp.risk_reviewed === 'Yes' || opp.risk_reviewed === true || opp.risk_reviewed === 'true' || opp.risk_reviewed === 1 || opp.risk_reviewed === '1';
    
    // DEBUG: Log the first few opportunities to see what we're getting
    if (oppsWithCalculatedLevels.indexOf(opp) < 3) {
      console.log(`DEBUG Opp ${opp.id}:`, {
        name: opp.name,
        risk_reviewed_raw: opp.risk_reviewed,
        risk_reviewed_type: typeof opp.risk_reviewed,
        isReviewed_calculated: isReviewed,
        reviewedFilter: reviewedFilter
      });
    }
    
    if (reviewedFilter === 'reviewed' && !isReviewed) return false;
    if (reviewedFilter === 'not_reviewed' && isReviewed) return false;
    
    // Mitigation plan filter - ensure it's a number
    const planStatus = parseInt(opp.risk_mitigation_plan) || 0;
    if (mitigationFilter === 'none' && planStatus !== 0) return false;
    if (mitigationFilter === 'partial' && planStatus !== 1) return false;
    if (mitigationFilter === 'complete' && planStatus !== 2) return false;
    if (mitigationFilter === 'incomplete' && planStatus === 2) return false; // 0 or 1 only
    
    return true;
  });

  const filteredCategorizedOpps = {
    CRITICAL: workflowFilteredOpps.filter(o => o.risk_level === 'CRITICAL'),
    HIGH: workflowFilteredOpps.filter(o => o.risk_level === 'HIGH'),
    MEDIUM: workflowFilteredOpps.filter(o => o.risk_level === 'MEDIUM'),
    LOW: workflowFilteredOpps.filter(o => o.risk_level === 'LOW'),
    UNSCORED: workflowFilteredOpps.filter(o => !o.risk_level || o.risk_score === 0)
  };

  const filteredTotalValue = workflowFilteredOpps.reduce((sum, opp) => sum + (opp.value || 0), 0);
  const filteredHighRiskValue = [...filteredCategorizedOpps.CRITICAL, ...filteredCategorizedOpps.HIGH].reduce((sum, opp) => sum + (opp.value || 0), 0);

  // Removed API config screen - now using server-side credentials

  if (view === 'assessment' && selectedOpp) {
    return <RiskAssessment 
      opp={selectedOpp} 
      apiConfig={apiConfig}
      callCurrentRMS={callCurrentRMS}
      onBack={() => {
        setView('dashboard');
        loadOpportunities();
      }} 
    />;
  }

  if (view === 'category' && selectedCategory) {
    return <CategoryDrilldown 
      category={selectedCategory} 
      opportunities={filteredCategorizedOpps[selectedCategory]}
      apiConfig={apiConfig}
      onBack={() => setView('dashboard')}
      onAssess={(opp) => {
        setSelectedOpp(opp);
        setView('assessment');
      }}
    />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Summary Stats */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-800">Risk Management Portal</h1>
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-semibold">v3.5</span>
              </div>
              <p className="text-gray-600 mb-4">Current RMS Opportunities by Risk Level</p>
              
              {/* Summary Stats Inline */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-600 mb-1">Total Opportunities</div>
                  <div className="text-xl font-bold text-gray-800">{oppsWithCalculatedLevels.length}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-600 mb-1">Total Value</div>
                  <div className="text-xl font-bold text-gray-800">${(filteredTotalValue / 1000).toFixed(0)}k</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-600 mb-1">High Risk Value</div>
                  <div className="text-xl font-bold text-red-600">${(filteredHighRiskValue / 1000).toFixed(0)}k</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-600 mb-1">Critical Items</div>
                  <div className="text-xl font-bold text-red-600">{filteredCategorizedOpps.CRITICAL.length}</div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => loadOpportunities()}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 ml-4"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* Loading Progress */}
          {loading && loadingProgress.total > 0 && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded p-3">
              <div className="text-sm text-blue-800 mb-1">
                Loading page {loadingProgress.current} of {loadingProgress.total}...
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Date Filter */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Event Start Date
            </label>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex gap-2">
                <button
                  onClick={() => handleDateFilterChange('30')}
                  className={`px-4 py-2 rounded-md font-medium ${
                    dateFilter === '30'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  0-30 Days
                </button>
                <button
                  onClick={() => handleDateFilterChange('60')}
                  className={`px-4 py-2 rounded-md font-medium ${
                    dateFilter === '60'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  30-60 Days
                </button>
                <button
                  onClick={() => handleDateFilterChange('90')}
                  className={`px-4 py-2 rounded-md font-medium ${
                    dateFilter === '90'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  60-90 Days
                </button>
                <button
                  onClick={() => handleDateFilterChange('all')}
                  className={`px-4 py-2 rounded-md font-medium ${
                    dateFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All (from today)
                </button>
                <button
                  onClick={() => handleDateFilterChange('custom')}
                  className={`px-4 py-2 rounded-md font-medium ${
                    dateFilter === 'custom'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Custom Range
                </button>
              </div>

              {dateFilter === 'custom' && (
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <span className="text-gray-600">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <button
                    onClick={handleCustomDateChange}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Workflow Filters */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Workflow Filters
                </label>
                {(reviewedFilter !== 'all' || mitigationFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setReviewedFilter('all');
                      setMitigationFilter('all');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Status
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setReviewedFilter('all')}
                    className={`px-3 py-1.5 text-sm rounded-md font-medium ${
                      reviewedFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setReviewedFilter('reviewed')}
                    className={`px-3 py-1.5 text-sm rounded-md font-medium ${
                      reviewedFilter === 'reviewed'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Reviewed
                  </button>
                  <button
                    onClick={() => setReviewedFilter('not_reviewed')}
                    className={`px-3 py-1.5 text-sm rounded-md font-medium ${
                      reviewedFilter === 'not_reviewed'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Not Reviewed
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mitigation Plan
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMitigationFilter('all')}
                    className={`px-3 py-1.5 text-sm rounded-md font-medium ${
                      mitigationFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setMitigationFilter('none')}
                    className={`px-3 py-1.5 text-sm rounded-md font-medium ${
                      mitigationFilter === 'none'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    None
                  </button>
                  <button
                    onClick={() => setMitigationFilter('partial')}
                    className={`px-3 py-1.5 text-sm rounded-md font-medium ${
                      mitigationFilter === 'partial'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Partial
                  </button>
                  <button
                    onClick={() => setMitigationFilter('complete')}
                    className={`px-3 py-1.5 text-sm rounded-md font-medium ${
                      mitigationFilter === 'complete'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => setMitigationFilter('incomplete')}
                    className={`px-3 py-1.5 text-sm rounded-md font-medium ${
                      mitigationFilter === 'incomplete'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Incomplete
                  </button>
                </div>
              </div>
            </div>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <div className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-700">{workflowFilteredOpps.length}</span> of <span className="font-semibold text-gray-700">{opportunities.length}</span> opportunities
                {(reviewedFilter !== 'all' || mitigationFilter !== 'all') && (
                  <span className="ml-2 text-xs">
                    (
                    {reviewedFilter !== 'all' && <span className="text-blue-600 font-medium">{reviewedFilter === 'reviewed' ? 'Reviewed' : 'Not Reviewed'}</span>}
                    {reviewedFilter !== 'all' && mitigationFilter !== 'all' && ' + '}
                    {mitigationFilter !== 'all' && <span className="text-blue-600 font-medium">Plan: {mitigationFilter.charAt(0).toUpperCase() + mitigationFilter.slice(1)}</span>}
                    )
                  </span>
                )}
              </div>
              {lastRefresh && (
                <p className="text-sm text-gray-500">
                  Last updated: {lastRefresh.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Debug: Raw Opportunities List - Toggleable */}
        {showDebug && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">🔍 Debug: All Loaded Opportunities</h2>
              <button 
                onClick={() => setShowDebug(false)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                ✕ Close
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Total opportunities in selected date range: {opportunities.length}
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {opportunities.map(opp => {
                const calculatedLevel = opp.risk_score > 0 
                  ? (opp.risk_score <= 2.0 ? 'LOW' : opp.risk_score <= 3.0 ? 'MEDIUM' : opp.risk_score <= 4.0 ? 'HIGH' : 'CRITICAL')
                  : 'none';
                
                return (
                  <div key={opp.id} className="bg-white p-3 rounded border border-gray-200 text-sm">
                    <div className="font-semibold">#{opp.id} - {opp.name}</div>
                    <div className="text-gray-600">
                      Start: {opp.starts_at} | 
                      Value: ${(opp.value / 1000).toFixed(1)}k | 
                      Risk Score: {opp.risk_score || 'none'} | 
                      Risk Level (stored): {opp.risk_level || 'none'} |
                      Risk Level (calculated): {calculatedLevel}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!showDebug && (
          <div className="mb-4">
            <button 
              onClick={() => setShowDebug(true)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Show Debug Info
            </button>
          </div>
        )}

        {/* Risk Categories */}
        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNSCORED'].map(level => {
          const opps = filteredCategorizedOpps[level];
          if (opps.length === 0) return null;
          
          const Icon = getRiskIcon(level);
          const colorClass = getRiskColor(level);
          const totalValue = opps.reduce((sum, o) => sum + (o.value || 0), 0);
          
          return (
            <div 
              key={level} 
              className={`bg-white rounded-lg shadow-lg p-6 mb-4 cursor-pointer hover:shadow-xl transition-shadow border-2 ${colorClass}`}
              onClick={() => {
                setSelectedCategory(level);
                setView('category');
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Icon className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">{level === 'UNSCORED' ? 'Un-scored' : level} RISK</h2>
                    <p className="text-sm text-gray-600">{opps.length} opportunities · ${(totalValue / 1000).toFixed(0)}k total value</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Click to view details</div>
                  <div className="text-lg font-semibold">→</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// CategoryDrilldown and RiskAssessment components remain the same as before
function CategoryDrilldown({ category, opportunities, apiConfig, onBack, onAssess }) {
  const getRiskIcon = (level) => {
    switch(level) {
      case 'LOW': return CheckCircle;
      case 'MEDIUM': return AlertTriangle;
      case 'HIGH': return AlertCircle;
      case 'CRITICAL': return AlertCircle;
      case 'UNSCORED': return AlertCircle;
      default: return AlertCircle;
    }
  };

  const getRiskColor = (level) => {
    switch(level) {
      case 'LOW': return 'bg-green-100 text-green-800 border-green-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-300';
      case 'UNSCORED': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const Icon = getRiskIcon(category);
  const colorClass = getRiskColor(category);
  const totalValue = opportunities.reduce((sum, o) => sum + (o.value || 0), 0);
  const totalCost = opportunities.reduce((sum, o) => sum + (o.estimated_cost || 0), 0);

  const getCurrentRMSUrl = (oppId) => {
    // Use hardcoded subdomain since we're using server-side credentials
    // Update this if your subdomain changes
    const subdomain = 'alvgroup';
    return `https://${subdomain}.current-rms.com/opportunities/${oppId}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <button onClick={onBack} className="mb-4 text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Dashboard
          </button>
          
          <div className={`flex items-center gap-4 mb-4 pb-4 border-b-2 ${colorClass.split(' ')[2]}`}>
            <Icon className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {category === 'UNSCORED' ? 'Un-scored' : category} RISK
              </h1>
              <p className="text-gray-600">
                {opportunities.length} opportunities · ${(totalValue / 1000).toFixed(0)}k revenue · ${(totalCost / 1000).toFixed(0)}k cost
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Opportunity Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenue</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Est. Cost</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Owner</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Start Date</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map(opp => (
                  <tr key={opp.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-800">{opp.name}</div>
                      <div className="text-sm text-gray-500">{opp.subject}</div>
                    </td>
                    <td className="py-3 px-4">
                      <a 
                        href={getCurrentRMSUrl(opp.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        #{opp.id}
                      </a>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-800">
                      ${(opp.value / 1000).toFixed(1)}k
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      ${(opp.estimated_cost / 1000).toFixed(1)}k
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {opp.owner}
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      {new Date(opp.starts_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {opp.risk_score > 0 ? (
                        <button
                          onClick={() => onAssess(opp)}
                          className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                        >
                          {opp.risk_score.toFixed(1)}
                        </button>
                      ) : (
                        <button
                          onClick={() => onAssess(opp)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Score
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskAssessment({ opp, apiConfig, callCurrentRMS, onBack }) {
  const [saving, setSaving] = useState(false);
  const [scores, setScores] = useState({
    projectNovelty: opp.risk_project_novelty || 3,
    technicalComplexity: opp.risk_technical_complexity || 3,
    resourceUtilization: opp.risk_resource_utilization || 3,
    clientSophistication: opp.risk_client_sophistication || 3,
    budgetSize: opp.risk_budget_size || 3,
    timeframeConstraint: opp.risk_timeframe_constraint || 3,
    teamExperience: opp.risk_team_experience || 3,
    equipmentAvailability: opp.risk_subhire_availability || 3
  });
  const [reviewed, setReviewed] = useState(opp.risk_reviewed || false);
  const [mitigationPlan, setMitigationPlan] = useState(opp.risk_mitigation_plan || 0);
  const [mitigationNotes, setMitigationNotes] = useState(opp.risk_mitigation_notes || '');

  const factors = [
    {
      id: 'projectNovelty',
      label: 'Project Type Familiarity',
      description: 'How familiar is the team with this type of production?',
      scale: [
        { value: 1, label: 'Routine/Repeated', risk: 'Low' },
        { value: 2, label: 'Similar to past', risk: 'Low-Med' },
        { value: 3, label: 'Some new elements', risk: 'Medium' },
        { value: 4, label: 'Significantly novel', risk: 'Med-High' },
        { value: 5, label: 'Entirely new territory', risk: 'High' }
      ],
      weight: 1.2
    },
    {
      id: 'technicalComplexity',
      label: 'Technical Complexity',
      description: 'System integration, equipment sophistication, setup complexity',
      scale: [
        { value: 1, label: 'Simple/Standard', risk: 'Low' },
        { value: 2, label: 'Moderate complexity', risk: 'Low-Med' },
        { value: 3, label: 'Complex systems', risk: 'Medium' },
        { value: 4, label: 'Highly complex', risk: 'Med-High' },
        { value: 5, label: 'Bleeding edge/Experimental', risk: 'High' }
      ],
      weight: 1.3
    },
    {
      id: 'resourceUtilization',
      label: 'Resource Utilization',
      description: 'Percentage of available equipment/crew committed',
      scale: [
        { value: 1, label: '0% utilization', risk: 'Low' },
        { value: 2, label: '1-24% utilization', risk: 'Low-Med' },
        { value: 3, label: '25-49% utilization', risk: 'Medium' },
        { value: 4, label: '50-74% utilization', risk: 'Med-High' },
        { value: 5, label: '75%+ utilization', risk: 'High' }
      ],
      weight: 1.1
    },
    {
      id: 'clientSophistication',
      label: 'Client Experience Level',
      description: 'Client familiarity with AV production processes',
      scale: [
        { value: 1, label: 'Highly experienced', risk: 'Low' },
        { value: 2, label: 'Experienced', risk: 'Low-Med' },
        { value: 3, label: 'Moderate experience', risk: 'Medium' },
        { value: 4, label: 'Limited experience', risk: 'Med-High' },
        { value: 5, label: 'First-time client', risk: 'High' }
      ],
      weight: 0.9
    },
    {
      id: 'budgetSize',
      label: 'Budget Scale',
      description: 'Project budget relative to typical projects',
      scale: [
        { value: 1, label: '<$5k', risk: 'Low' },
        { value: 2, label: '$5k-$10k', risk: 'Low-Med' },
        { value: 3, label: '$10k-$40k', risk: 'Medium' },
        { value: 4, label: '$40k-$100k', risk: 'Med-High' },
        { value: 5, label: '$100k+', risk: 'High' }
      ],
      weight: 1.0
    },
    {
      id: 'timeframeConstraint',
      label: 'Timeline Pressure',
      description: 'Prep time available vs. required',
      scale: [
        { value: 1, label: 'Ample time (>2x needed)', risk: 'Low' },
        { value: 2, label: 'Comfortable (1.5x needed)', risk: 'Low-Med' },
        { value: 3, label: 'Standard timeline', risk: 'Medium' },
        { value: 4, label: 'Tight timeline', risk: 'Med-High' },
        { value: 5, label: 'Rush/Emergency', risk: 'High' }
      ],
      weight: 1.2
    },
    {
      id: 'teamExperience',
      label: 'Team Capability',
      description: 'Assigned team experience with similar projects',
      scale: [
        { value: 1, label: 'Expert team', risk: 'Low' },
        { value: 2, label: 'Experienced team', risk: 'Low-Med' },
        { value: 3, label: 'Competent team', risk: 'Medium' },
        { value: 4, label: 'Learning team', risk: 'Med-High' },
        { value: 5, label: 'Inexperienced team', risk: 'High' }
      ],
      weight: 1.3
    },
    {
      id: 'equipmentAvailability',
      label: 'Sub-hire Availability',
      description: 'Access to external equipment/crew if needed',
      scale: [
        { value: 1, label: 'Multiple vendors available', risk: 'Low' },
        { value: 2, label: 'Good sub-hire options', risk: 'Low-Med' },
        { value: 3, label: 'Limited sub-hire options', risk: 'Medium' },
        { value: 4, label: 'Minimal sub-hire options', risk: 'Med-High' },
        { value: 5, label: 'No sub-hire available', risk: 'High' }
      ],
      weight: 1.1
    }
  ];

  const calculateRiskScore = () => {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    factors.forEach(factor => {
      totalWeightedScore += scores[factor.id] * factor.weight;
      totalWeight += factor.weight;
    });

    return (totalWeightedScore / totalWeight).toFixed(2);
  };

  const getRiskLevel = (score) => {
    if (score <= 2.0) return { level: 'LOW', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle };
    if (score <= 3.0) return { level: 'MEDIUM', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: AlertTriangle };
    if (score <= 4.0) return { level: 'HIGH', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: AlertCircle };
    return { level: 'CRITICAL', color: 'bg-red-100 text-red-800 border-red-300', icon: AlertCircle };
  };

  const getApprovalRequired = (score) => {
    if (score <= 2.0) return 'Project Manager';
    if (score <= 3.0) return 'Senior Manager';
    if (score <= 4.0) return 'Operations Director';
    return 'Executive Approval Required';
  };

  const handleSave = async () => {
    setSaving(true);
    const riskScore = parseFloat(calculateRiskScore());
    const riskData = getRiskLevel(riskScore);
    const currentTimestamp = new Date().toISOString();
    
    try {
      console.log('Saving risk assessment to Current RMS...');
      
      const data = await callCurrentRMS(
        `opportunities/${opp.id}`,
        'PATCH',
        {
          opportunity: {
            custom_fields: {
              risk_score: riskScore,
              risk_level: riskData.level,
              risk_project_novelty: scores.projectNovelty,
              risk_technical_complexity: scores.technicalComplexity,
              risk_resource_utilization: scores.resourceUtilization,
              risk_client_sophistication: scores.clientSophistication,
              risk_budget_size: scores.budgetSize,
              risk_timeframe_constraint: scores.timeframeConstraint,
              risk_team_experience: scores.teamExperience,
              risk_subhire_availability: scores.equipmentAvailability,
              risk_reviewed: reviewed ? 'Yes' : '',
              risk_mitigation_plan: mitigationPlan,
              risk_last_updated: currentTimestamp,
              risk_mitigation_notes: mitigationNotes
            }
          }
        }
      );
      
      console.log('Risk assessment saved successfully');
      alert(`✅ Risk assessment saved successfully!\n\nScore: ${riskScore}\nLevel: ${riskData.level}\nApproval: ${getApprovalRequired(riskScore)}`);
      
      onBack();
    } catch (error) {
      console.error('Error saving risk assessment:', error);
      alert(`❌ Error saving risk assessment: ${error.message}\n\nPlease try again or contact support.`);
    } finally {
      setSaving(false);
    }
  };

  const riskScore = calculateRiskScore();
  const riskData = getRiskLevel(parseFloat(riskScore));
  const RiskIcon = riskData.icon;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={onBack} className="text-blue-600 hover:text-blue-700 font-medium">
              ← Back to Dashboard
            </button>
            
            <div className={`flex items-center gap-3 px-4 py-2 border-2 ${riskData.color} rounded-lg`}>
              <RiskIcon className="w-8 h-8" />
              <div>
                <div className="text-xs font-medium opacity-75">Risk Score</div>
                <div className="text-2xl font-bold">{riskScore}</div>
              </div>
              <div className="border-l-2 border-current pl-3 ml-2">
                <div className="text-sm font-bold">{riskData.level}</div>
                <div className="text-xs">{getApprovalRequired(parseFloat(riskScore))}</div>
              </div>
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-gray-800 mb-4">{opp.name}</h2>

          {/* Compact 2-column grid for all factors */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {factors.map(factor => (
              <div key={factor.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="mb-2">
                  <h3 className="font-semibold text-sm text-gray-800">{factor.label}</h3>
                  <p className="text-xs text-gray-600">{factor.description}</p>
                </div>
                
                {/* Compact button group - horizontal layout */}
                <div className="flex gap-1">
                  {factor.scale.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setScores({...scores, [factor.id]: option.value})}
                      className={`flex-1 px-2 py-2 text-xs rounded transition-all ${
                        scores[factor.id] === option.value
                          ? 'bg-blue-600 text-white font-semibold shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                      title={`${option.label} - ${option.risk} Risk`}
                    >
                      <div className="font-bold">{option.value}</div>
                      <div className="text-[10px] leading-tight mt-0.5">{option.risk}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Workflow Status Controls */}
          <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reviewed}
                  onChange={(e) => setReviewed(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="font-semibold text-gray-800">Mark as Reviewed</span>
              </label>
              <p className="text-xs text-gray-600 ml-7">Check this when risk assessment is reviewed</p>
            </div>
            
            <div>
              <label className="block font-semibold text-gray-800 mb-2">Mitigation Plan Status</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMitigationPlan(0)}
                  className={`flex-1 px-3 py-2 text-sm rounded transition-all ${
                    mitigationPlan === 0
                      ? 'bg-red-600 text-white font-semibold'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  None
                </button>
                <button
                  onClick={() => setMitigationPlan(1)}
                  className={`flex-1 px-3 py-2 text-sm rounded transition-all ${
                    mitigationPlan === 1
                      ? 'bg-yellow-600 text-white font-semibold'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  Partial
                </button>
                <button
                  onClick={() => setMitigationPlan(2)}
                  className={`flex-1 px-3 py-2 text-sm rounded transition-all ${
                    mitigationPlan === 2
                      ? 'bg-green-600 text-white font-semibold'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  Complete
                </button>
              </div>
            </div>
          </div>

          {/* Mitigation Plan Notes */}
          <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <label className="block font-semibold text-gray-800 mb-2">
              Mitigation Plan Notes
              {opp.risk_last_updated && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  Last updated: {new Date(opp.risk_last_updated).toLocaleString()}
                </span>
              )}
            </label>
            <textarea
              value={mitigationNotes}
              onChange={(e) => setMitigationNotes(e.target.value)}
              placeholder="Describe the mitigation strategies, backup plans, contingencies, or special arrangements for this opportunity..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
            <p className="text-xs text-gray-600 mt-1">
              Document key mitigation strategies, backup equipment, additional crew, contingencies, or special arrangements.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Risk Assessment'
              )}
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
    </div>
  );
}
