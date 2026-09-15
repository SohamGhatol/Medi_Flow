import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import StaffNavbar from './common/StaffNavbar';
import api from '../services/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const DemandAnalytics = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [daysPeriod, setDaysPeriod] = useState(30);
  const [granularity, setGranularity] = useState('day');
  const [medicineId, setMedicineId] = useState('');
  const [metric, setMetric] = useState('total');
  
  // Data
  const [medicines, setMedicines] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [weeksContext, setWeeksContext] = useState(1);
  const [trendData, setTrendData] = useState([]);
  const [rankingData, setRankingData] = useState([]);
  
  useEffect(() => {
    if (authLoading) return;
    
    // Allow any authenticated staff/admin
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchMedicines();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [daysPeriod, granularity, medicineId, metric, user]);

  const fetchMedicines = async () => {
    try {
      const res = await api.get('/medicines');
      setMedicines(res.data);
    } catch (err) {
      console.error('Error fetching medicines', err);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { days: daysPeriod, granularity };
      if (medicineId) params.medicine_id = medicineId;
      
      const [heatRes, rankRes] = await Promise.all([
        api.get('/demand/heatmap', { params }),
        api.get('/demand/ranking', { params: { days: daysPeriod } })
      ]);
      
      setHeatmapData(heatRes.data.data);
      setWeeksContext(heatRes.data.weeks || 1);
      setRankingData(rankRes.data);
      
      if (medicineId) {
        const trendRes = await api.get('/demand/trend', { params: { days: daysPeriod, medicine_id: medicineId } });
        setTrendData(trendRes.data.trend);
      } else {
        setTrendData([]);
      }
      
    } catch (err) {
      console.error(err);
      setError('Failed to load demand analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getHeatmapColor = (value, max) => {
    if (!value || value === 0) return 'bg-slate-50 text-slate-400';
    
    const ratio = value / (max || 1);
    if (ratio > 0.8) return 'bg-blue-600 text-white font-bold';
    if (ratio > 0.6) return 'bg-blue-500 text-white font-semibold';
    if (ratio > 0.4) return 'bg-blue-400 text-white font-medium';
    if (ratio > 0.2) return 'bg-blue-300 text-slate-800';
    return 'bg-blue-100 text-slate-800';
  };

  const renderHeatmap = () => {
    if (!heatmapData || heatmapData.length === 0) {
      return (
        <div className="py-12 text-center bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="text-slate-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900">No demand data found</h3>
          <p className="text-slate-500 mt-1">Try selecting a different date range or medicine.</p>
        </div>
      );
    }

    const columns = granularity === 'day' 
      ? [1, 2, 3, 4, 5, 6, 7] 
      : Array.from({length: 13}, (_, i) => i + 8); // 08:00 to 20:00

    const colHeaders = granularity === 'day'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : columns.map(h => `${h.toString().padStart(2, '0')}:00`);

    // Find global max to normalize colors
    let maxVal = 0;
    heatmapData.forEach(row => {
      columns.forEach(col => {
        let val = row[col.toString()] || 0;
        if (metric === 'average' && granularity === 'day') {
          val = val / weeksContext;
        }
        if (val > maxVal) maxVal = val;
      });
    });

    return (
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-[200px_repeat(auto-fit,minmax(0,1fr))] border-b border-slate-200">
            <div className="p-3 font-semibold text-slate-700 bg-slate-50">Medicine</div>
            {colHeaders.map((header, idx) => (
              <div key={idx} className="p-3 text-center font-semibold text-slate-700 bg-slate-50 border-l border-slate-200 text-sm">
                {header}
              </div>
            ))}
          </div>
          
          {heatmapData.map((row) => (
            <div key={row.medicine_id} className="grid grid-cols-[200px_repeat(auto-fit,minmax(0,1fr))] border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
              <div className="p-3 text-sm font-medium text-slate-900 truncate" title={row.medicine_name}>
                {row.medicine_name}
              </div>
              {columns.map(col => {
                let rawVal = row[col.toString()] || 0;
                let displayVal = rawVal;
                
                if (metric === 'average' && granularity === 'day' && rawVal > 0) {
                  displayVal = (rawVal / weeksContext).toFixed(1);
                }

                return (
                  <div 
                    key={col} 
                    className={`p-3 text-center text-sm border-l border-white ${getHeatmapColor(metric === 'average' && granularity === 'day' ? rawVal/weeksContext : rawVal, maxVal)} transition-colors duration-200`}
                    title={`${row.medicine_name} - ${colHeaders[columns.indexOf(col)]}\nUnits: ${displayVal}`}
                  >
                    {displayVal === 0 || displayVal === '0.0' ? '-' : displayVal}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTrendChart = () => {
    if (!medicineId || trendData.length === 0) return null;

    const data = {
      labels: trendData.map(d => {
        const date = new Date(d.date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      }),
      datasets: [
        {
          label: 'Actual Demand',
          data: trendData.map(d => d.actual),
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: trendData.map(d => d.is_spike ? 'rgba(239, 68, 68, 1)' : 'rgba(59, 130, 246, 1)'),
          pointRadius: trendData.map(d => d.is_spike ? 6 : 3),
        },
        {
          label: 'Moving Average (7d)',
          data: trendData.map(d => d.moving_avg),
          borderColor: 'rgba(100, 116, 139, 0.8)',
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          tension: 0.3
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: {
          callbacks: {
            afterBody: (context) => {
              const idx = context[0].dataIndex;
              if (trendData[idx].is_spike) return '\n⚠️ Unusual Demand Spike Detected';
              return '';
            }
          }
        }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
        x: { grid: { display: false } }
      }
    };

    return (
      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Demand Trend</h3>
            <p className="text-sm text-slate-500">Time-series view of actual demand vs 7-day moving average</p>
          </div>
          {trendData.some(d => d.is_spike) && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <span className="w-2 h-2 mr-1.5 bg-red-500 rounded-full animate-pulse"></span>
              Recent Spikes Detected
            </span>
          )}
        </div>
        <div className="h-72">
          <Line data={data} options={options} />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <StaffNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <button 
                onClick={() => navigate(-1)} 
                className="mr-4 text-slate-400 hover:text-slate-600 transition-colors"
                title="Go Back"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-slate-900">Medicine Demand Intelligence</h1>
            </div>
            <p className="mt-1 text-sm text-slate-500 ml-10">Analyze historical medicine demand patterns to support inventory planning.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date Range</label>
              <select
                value={daysPeriod}
                onChange={(e) => setDaysPeriod(Number(e.target.value))}
                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
                <option value={180}>Last 6 Months</option>
                <option value={365}>Last 12 Months</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Medicine</label>
              <select
                value={medicineId}
                onChange={(e) => setMedicineId(e.target.value)}
                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">All Medicines</option>
                {medicines.map(m => (
                  <option key={m.medicine_id} value={m.medicine_id}>{m.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Granularity</label>
              <select
                value={granularity}
                onChange={(e) => setGranularity(e.target.value)}
                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="day">Day of Week</option>
                <option value="hour">Hour of Day</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Metric</label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="total">Total Units Sold</option>
                <option value="average">Average Units / Period</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-lg font-bold text-slate-900">Demand Heatmap</h2>
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <span>Low</span>
                <div className="flex space-x-1">
                  <div className="w-4 h-4 bg-blue-100 rounded"></div>
                  <div className="w-4 h-4 bg-blue-300 rounded"></div>
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                </div>
                <span>High</span>
              </div>
            </div>
            
            {loading ? (
              <div className="h-64 flex items-center justify-center bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              renderHeatmap()
            )}
            
            {!loading && renderTrendChart()}
          </div>
          
          <div className="lg:col-span-1">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Top Demand Medicines</h2>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <ul className="divide-y divide-slate-200">
                {loading ? (
                  <li className="p-6 text-center text-slate-500">Loading...</li>
                ) : rankingData.length === 0 ? (
                  <li className="p-6 text-center text-slate-500">No data available</li>
                ) : (
                  rankingData.map((item, idx) => (
                    <li key={item.medicine_id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx < 3 ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'}`}>
                            {idx + 1}
                          </span>
                          <span className="ml-3 font-medium text-slate-900 text-sm">{item.medicine_name}</span>
                        </div>
                        <span className="text-sm font-bold text-primary-600">{item.total_sold} units</span>
                      </div>
                      <div className="mt-2 pl-9 grid grid-cols-2 gap-2 text-xs text-slate-500">
                        <div>
                          <span className="block text-slate-400 uppercase tracking-wider text-[10px]">Daily Avg</span>
                          <span className="font-medium">{item.daily_avg}</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 uppercase tracking-wider text-[10px]">Est. Stock Days</span>
                          <span className={`font-medium ${item.est_days_stock < 7 ? 'text-red-500' : 'text-green-500'}`}>
                            {item.est_days_stock > 365 ? '>1 yr' : `${item.est_days_stock}d`}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default DemandAnalytics;
