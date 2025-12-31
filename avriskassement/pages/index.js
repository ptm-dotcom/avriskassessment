import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, RefreshCw, Calendar, DollarSign, User } from 'lucide-react';

export default function RiskManagementPortal() {
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'assessment' or 'category'
  const [opportunities, setOpportunities] = useState([]);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [dateFilter, setDateFilter] = useState('all'); // 'all', '30', '60', '90', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [apiConfig, setApiConfig] = useState({
    subdomain: '',
    authToken: '',
    configured: false
  });

  // Mock data for demonstration - replace with real API calls
  const mockOpportunities = [
    { id: 1001, name: 'Corporate Event - Tech Summit 2026', subject: 'Conference AV', value: 45000, estimated_cost: 32000, owner: 'Sarah M.', starts_at: '2026-02-15', contact_name: 'John Smith', risk_score: 4.2, risk_level: 'CRITICAL' },
    { id: 1002, name: 'Wedding Reception - Grand Hotel', subject: 'Wedding', value: 8500, estimated_cost: 5200, owner: 'Mike T.', starts_at: '2026-01-20', contact_name: 'Sarah Johnson', risk_score: 2.1, risk_level: 'MEDIUM' },
    { id: 1003, name: 'Product Launch - Stadium Event', subject: 'Product Launch', value: 95000, estimated_cost: 68000, owner: 'Sarah M.', starts_at: '2026-03-10', contact_name: 'Mike Chen', risk_score: 4.8, risk_level: 'CRITICAL' },
    { id: 1004, name: 'Corporate Training Day', subject: 'Corporate', value: 3200, estimated_cost: 1800, owner: 'John D.', starts_at: '2026-01-25', contact_name: 'Emma Wilson', risk_score: 1.5, risk_level: 'LOW' },
    { id: 1005, name: 'Music Festival Main Stage', subject: 'Festival', value: 125000, estimated_cost: 89000, owner: 'Sarah M.', starts_at: '2026-04-05', contact_name: 'David Lee', risk_score: 3.8, risk_level: 'HIGH' },
    { id: 1006, name: 'AGM - Convention Center', subject: 'AGM', value: 12000, estimated_cost: 7500, owner: 'Mike T.', starts_at: '2026-02-01', contact_name: 'Lisa Brown', risk_score: 1.8, risk_level: 'LOW' },
    { id: 1007, name: 'Trade Show Booth', subject: 'Trade Show', value: 6500, estimated_cost: 4200, owner: 'John D.', starts_at: '2026-01-30', contact_name: 'Tom Anderson', risk_score: 2.8, risk_level: 'MEDIUM' },
    { id: 1008, name: 'Live Broadcast - Sports Arena', subject: 'Broadcast', value: 78000, estimated_cost: 55000, owner: 'Sarah M.', starts_at: '2026-02-20', contact_name: 'Rachel Green', risk_score: 4.5, risk_level: 'CRITICAL' },
    { id: 1009, name: 'New Client Consultation', subject: 'Consultation', value: 15000, estimated_cost: 9000, owner: 'John D.', starts_at: '2026-01-28', contact_name: 'Peter Wang', risk_score: 0, risk_level: null },
    { id: 1010, name: 'Charity Gala Evening', subject: 'Gala', value: 22000, estimated_cost: 14000, owner: 'Mike T.', starts_at: '2026-02-10', contact_name: 'Jane Smith', risk_score: 0, risk_level: null }
  ];

  useEffect(() => {
    const saved = localStorage.getItem('currentRMS_config');
    if (saved) {
      const config = JSON.parse(saved);
      setApiConfig(config);
      if (config.configured) {
        loadOpportunities(config);
      }
    } else {
      // Use mock data for demo
      setOpportunities(mockOpportunities);
      setLastRefresh(new Date());
    }
  }, []);

  const saveApiConfig = () => {
    const config = { ...apiConfig, configured: true };
    localStorage.setItem('currentRMS_config', JSON.stringify(config));
    setApiConfig(config);
    loadOpportunities(config);
  };

  const loadOpportunities = async (config) => {
    setLoading(true);
    try {
      if (config.subdomain && config.authToken) {
        console.log('Fetching from Current RMS API...');
        
        // Make actual API call to Current RMS
        const response = await fetch(`https://api.current-rms.com/api/v1/opportunities`, {
          method: 'GET',
          headers: {
            'X-SUBDOMAIN': config.subdomain,
            'X-AUTH-TOKEN': config.authToken,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        // Check if data has opportunities array
        if (!data.opportunities || !Array.isArray(data.opportunities)) {
          console.error('Unexpected API response structure:', data);
          throw new Error('Invalid API response structure');
        }
        
        // Transform Current RMS data to our format
        const transformedOpps = data.opportunities.map(opp => ({
          id: opp.id,
          name: opp.subject || 'Untitled Opportunity',
          subject: opp.subject,
          value: parseFloat(opp.charge_total) || 0,
          estimated_cost: parseFloat(opp.cost_total) || 0,
          owner: opp.owner?.name || 'Unassigned',
          starts_at: opp.starts_at,
          contact_name: opp.organisation?.name || 'No contact',
          risk_score: parseFloat(opp.custom_fields?.risk_score || 0),
          risk_level: opp.custom_fields?.risk_level || null
        }));
        
        console.log('Transformed opportunities:', transformedOpps.length);
        setOpportunities(transformedOpps);
        setLastRefresh(new Date());
      } else {
        console.log('No API config, using mock data');
        // No config, use mock data
        setOpportunities(mockOpportunities);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Error loading opportunities:', error);
      alert(`Error connecting to Current RMS: ${error.message}\n\nUsing demo data instead.\n\nCheck browser console for details.`);
      setOpportunities(mockOpportunities);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
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
    const start = new Date();
    let end = new Date();
    
    if (dateFilter === 'all') {
      // Return a very wide date range to include everything
      return {
        start: new Date('2000-01-01'),
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
    
    const days = parseInt(dateFilter);
    // Look both backwards and forwards
    start.setDate(start.getDate() - days); // Past opportunities
    end.setDate(end.getDate() + days); // Future opportunities
    return { start, end };
  };

  const filteredOpportunities = opportunities.filter(opp => {
    const oppDate = new Date(opp.starts_at);
    const { start, end } = getDateRange();
    return oppDate >= start && oppDate <= end;
  });

  const filteredCategorizedOpps = {
    CRITICAL: filteredOpportunities.filter(o => o.risk_level === 'CRITICAL'),
    HIGH: filteredOpportunities.filter(o => o.risk_level === 'HIGH'),
    MEDIUM: filteredOpportunities.filter(o => o.risk_level === 'MEDIUM'),
    LOW: filteredOpportunities.filter(o => o.risk_level === 'LOW'),
    UNSCORED: filteredOpportunities.filter(o => !o.risk_level || o.risk_score === 0)
  };

  const filteredTotalValue = filteredOpportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);
  const filteredHighRiskValue = [...filteredCategorizedOpps.CRITICAL, ...filteredCategorizedOpps.HIGH].reduce((sum, opp) => sum + (opp.value || 0), 0);

  if (!apiConfig.configured && view === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Risk Management Portal</h1>
            <p className="text-gray-600 mb-6">Configure your Current RMS connection</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current RMS Subdomain
                </label>
                <input
                  type="text"
                  value={apiConfig.subdomain}
                  onChange={(e) => setApiConfig({...apiConfig, subdomain: e.target.value})}
                  placeholder="your-company"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">From: your-company.current-rms.com</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Auth Token
                </label>
                <input
                  type="password"
                  value={apiConfig.authToken}
                  onChange={(e) => setApiConfig({...apiConfig, authToken: e.target.value})}
                  placeholder="Your API token"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">From: Settings → API in Current RMS</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={saveApiConfig}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Connect to Current RMS
                </button>
                <button
                  onClick={() => {
                    setApiConfig({...apiConfig, configured: true});
                    setOpportunities(mockOpportunities);
                    setLastRefresh(new Date());
                  }}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Use Demo Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'assessment' && selectedOpp) {
    return <RiskAssessment 
      opp={selectedOpp} 
      apiConfig={apiConfig}
      onBack={() => {
        setView('dashboard');
        loadOpportunities(apiConfig); // Reload to get updated data
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
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">v2.2-debug</span>
              </div>
              <p className="text-gray-600 mb-4">Current RMS Opportunities by Risk Level</p>
              
              {/* Summary Stats Inline */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-xs text-gray-600 mb-1">Total Opportunities</div>
                  <div className="text-xl font-bold text-gray-800">{filteredOpportunities.length}</div>
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
              onClick={() => loadOpportunities(apiConfig)}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 ml-4"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Date Filter */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Event Start Date
            </label>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex gap-2">
                <button
                  onClick={() => setDateFilter('all')}
                  className={`px-4 py-2 rounded-md font-medium ${
                    dateFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Dates
                </button>
                <button
                  onClick={() => setDateFilter('30')}
                  className={`px-4 py-2 rounded-md font-medium ${
                    dateFilter === '30'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ±30 Days
                </button>
                <button
                  onClick={() => setDateFilter('60')}
                  className={`px-4 py-2 rounded-md font-medium ${
                    dateFilter === '60'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ±60 Days
                </button>
                <button
                  onClick={() => setDateFilter('90')}
                  className={`px-4 py-2 rounded-md font-medium ${
                    dateFilter === '90'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ±90 Days
                </button>
                <button
                  onClick={() => setDateFilter('custom')}
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
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-gray-500">
                Showing opportunities from {getDateRange().start.toLocaleDateString()} to {getDateRange().end.toLocaleDateString()}
              </p>
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
              Total loaded from API: {opportunities.length} | After date filter: {filteredOpportunities.length}
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {opportunities.map(opp => {
                // Calculate what the risk level SHOULD be
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
    if (apiConfig.subdomain) {
      const cleanSubdomain = apiConfig.subdomain.replace('.current-rms.com', '').trim();
      return `https://${cleanSubdomain}.current-rms.com/opportunities/${oppId}`;
    }
    return `https://your-company.current-rms.com/opportunities/${oppId}`;
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

          {/* Table */}
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

function RiskAssessment({ opp, apiConfig, onBack }) {
  const [saving, setSaving] = useState(false);
  const [scores, setScores] = useState({
    projectNovelty: 3,
    technicalComplexity: 3,
    resourceUtilization: 3,
    clientSophistication: 3,
    budgetSize: 3,
    timeframeConstraint: 3,
    teamExperience: 3,
    equipmentAvailability: 3
  });

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
    
    try {
      if (apiConfig.subdomain && apiConfig.authToken) {
        console.log('Saving risk assessment to Current RMS...');
        
        const cleanSubdomain = apiConfig.subdomain.replace('.current-rms.com', '').trim();
        
        // Update opportunity with risk score via Current RMS API
        const response = await fetch(`https://api.current-rms.com/api/v1/opportunities/${opp.id}?subdomain=${cleanSubdomain}`, {
          method: 'PATCH',
          headers: {
            'X-SUBDOMAIN': cleanSubdomain,
            'X-AUTH-TOKEN': apiConfig.authToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
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
                risk_subhire_availability: scores.equipmentAvailability
              }
            }
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to save: ${response.status} ${errorText}`);
        }
        
        console.log('Risk assessment saved successfully');
        alert(`✅ Risk assessment saved successfully!\n\nScore: ${riskScore}\nLevel: ${riskData.level}\nApproval: ${getApprovalRequired(riskScore)}`);
      } else {
        // No API config - just show what would be saved
        alert(`⚠️ Demo Mode - Risk assessment not saved to Current RMS\n\nScore: ${riskScore}\nLevel: ${riskData.level}\nApproval: ${getApprovalRequired(riskScore)}\n\nConfigure API credentials to save assessments.`);
      }
      
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <button onClick={onBack} className="mb-4 text-blue-600 hover:text-blue-700">
            ← Back to Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Risk Assessment</h1>
          <h2 className="text-xl text-gray-600 mb-6">{opp.name}</h2>
          
          <div className={`border-2 ${riskData.color} rounded-lg p-6 mb-6`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <RiskIcon className="w-12 h-12" />
                <div>
                  <div className="text-sm font-medium opacity-75">Overall Risk Score</div>
                  <div className="text-4xl font-bold">{riskScore}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold mb-1">{riskData.level} RISK</div>
                <div className="text-sm font-medium">Approval: {getApprovalRequired(parseFloat(riskScore))}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 mb-6">
            {factors.map(factor => (
              <div key={factor.id} className="bg-gray-50 rounded-lg p-4">
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-800 mb-1">{factor.label}</h3>
                  <p className="text-sm text-gray-600">{factor.description}</p>
                </div>
                
                <div className="space-y-2">
                  {factor.scale.map(option => (
                    <label key={option.value} className="flex items-center gap-3 p-2 rounded hover:bg-white cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name={factor.id}
                        value={option.value}
                        checked={scores[factor.id] === option.value}
                        onChange={() => setScores({...scores, [factor.id]: option.value})}
                        className="w-4 h-4"
                      />
                      <span className="flex-1 text-sm">{option.label}</span>
                      <span className="text-xs font-medium text-gray-500 min-w-20 text-right">{option.risk} Risk</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

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
