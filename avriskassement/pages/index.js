import React, { useState } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AVRiskAssessment() {
  const [scores, setScores] = useState({
    projectNovelty: 0,
    technicalComplexity: 0,
    resourceUtilization: 0,
    clientSophistication: 0,
    budgetSize: 0,
    timeframeConstraint: 0,
    teamExperience: 0,
    equipmentAvailability: 0
  });

  const factors = [
    {
      id: 'projectNovelty',
      label: 'Project Type Familiarity',
      description: 'How familiar is the team with this type of production?',
      scale: [
        { value: 0, label: 'Routine/Repeated', risk: 'Low' },
        { value: 3, label: 'Similar to past', risk: 'Low-Med' },
        { value: 7, label: 'Some new elements', risk: 'Medium' },
        { value: 31, label: 'Significantly novel', risk: 'Med-High' },
        { value: 127, label: 'Entirely new territory', risk: 'High' }
      ],
      weight: 1.0
    },
    {
      id: 'technicalComplexity',
      label: 'Technical Complexity',
      description: 'System integration, equipment sophistication, setup complexity',
      scale: [
        { value: 0, label: 'Simple/Standard', risk: 'Low' },
        { value: 3, label: 'Moderate complexity', risk: 'Low-Med' },
        { value: 7, label: 'Complex systems', risk: 'Medium' },
        { value: 31, label: 'Highly complex', risk: 'Med-High' },
        { value: 127, label: 'Bleeding edge/Experimental', risk: 'High' }
      ],
      weight: 1.0
    },
    {
      id: 'resourceUtilization',
      label: 'Resource Utilization',
      description: 'Percentage of available equipment/crew committed',
      scale: [
        { value: 0, label: '0% utilization', risk: 'Low' },
        { value: 3, label: '1-24% utilization', risk: 'Low-Med' },
        { value: 7, label: '25-49% utilization', risk: 'Medium' },
        { value: 31, label: '50-74% utilization', risk: 'Med-High' },
        { value: 127, label: '75%+ utilization', risk: 'High' }
      ],
      weight: 1.0
    },
    {
      id: 'clientSophistication',
      label: 'Client Experience Level',
      description: 'Client familiarity with AV production processes',
      scale: [
        { value: 0, label: 'Highly experienced', risk: 'Low' },
        { value: 3, label: 'Experienced', risk: 'Low-Med' },
        { value: 7, label: 'Moderate experience', risk: 'Medium' },
        { value: 31, label: 'Limited experience', risk: 'Med-High' },
        { value: 127, label: 'First-time client', risk: 'High' }
      ],
      weight: 1.0
    },
    {
      id: 'budgetSize',
      label: 'Budget Scale',
      description: 'Project budget relative to typical projects',
      scale: [
        { value: 0, label: '<$5k', risk: 'Low' },
        { value: 3, label: '$5k-$10k', risk: 'Low-Med' },
        { value: 7, label: '$10k-$40k', risk: 'Medium' },
        { value: 31, label: '$40k-$100k', risk: 'Med-High' },
        { value: 127, label: '$100k+', risk: 'High' }
      ],
      weight: 1.0
    },
    {
      id: 'timeframeConstraint',
      label: 'Timeline Pressure',
      description: 'Prep time available vs. required',
      scale: [
        { value: 0, label: 'Ample time (>2x needed)', risk: 'Low' },
        { value: 3, label: 'Comfortable (1.5x needed)', risk: 'Low-Med' },
        { value: 7, label: 'Standard timeline', risk: 'Medium' },
        { value: 31, label: 'Tight timeline', risk: 'Med-High' },
        { value: 127, label: 'Rush/Emergency', risk: 'High' }
      ],
      weight: 1.0
    },
    {
      id: 'teamExperience',
      label: 'Team Capability',
      description: 'Assigned team experience with similar projects',
      scale: [
        { value: 0, label: 'Expert team', risk: 'Low' },
        { value: 3, label: 'Experienced team', risk: 'Low-Med' },
        { value: 7, label: 'Competent team', risk: 'Medium' },
        { value: 31, label: 'Learning team', risk: 'Med-High' },
        { value: 127, label: 'Inexperienced team', risk: 'High' }
      ],
      weight: 1.0
    },
    {
      id: 'equipmentAvailability',
      label: 'Sub-hire Availability',
      description: 'Access to external equipment/crew if needed',
      scale: [
        { value: 0, label: 'Multiple vendors available', risk: 'Low' },
        { value: 3, label: 'Good sub-hire options', risk: 'Low-Med' },
        { value: 7, label: 'Limited sub-hire options', risk: 'Medium' },
        { value: 31, label: 'Minimal sub-hire options', risk: 'Med-High' },
        { value: 127, label: 'No sub-hire available', risk: 'High' }
      ],
      weight: 1.0
    }
  ];

  const calculateRiskScore = () => {
    let totalWeightedScore = 0;
    let totalWeight = 0;

    factors.forEach(factor => {
      totalWeightedScore += scores[factor.id] * factor.weight;
      totalWeight += factor.weight;
    });

    return (totalWeightedScore).toFixed(2);
  };

  const getRiskLevel = (score) => {
    if (score <= 24.0) return { level: 'LOW', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle };
    if (score <= 32.0) return { level: 'MEDIUM', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: AlertTriangle };
    if (score <= 127.0) return { level: 'HIGH', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: AlertCircle };
    return { level: 'CRITICAL', color: 'bg-red-100 text-red-800 border-red-300', icon: AlertCircle };
  };

  const getApprovalRequired = (score) => {
    if (score <= 24.0) return 'Account Manager';
    if (score <= 32.0) return 'Delivery Manager';
    if (score <= 127.0) return 'Operations Manager';
    return 'Executive Approval Required';
  };

  const riskScore = calculateRiskScore();
  const riskData = getRiskLevel(parseFloat(riskScore));
  const RiskIcon = riskData.icon;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">AV Production Risk Assessment</h1>
        <p className="text-gray-600 mb-6">Evaluate project risk factors to determine approval requirements and mitigation strategies</p>
        
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

        <div className="grid gap-6">
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

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Integration with Current RMS</h3>
          <p className="text-sm text-blue-800">
            This scoring model can be integrated into Current RMS through custom fields mapped to each risk factor. 
            The calculated risk score can trigger workflow automations for approval routing based on thresholds.
            Risk scores can be stored against quotes/orders and updated as project details evolve.
          </p>
        </div>
      </div>
    </div>
  );
}
