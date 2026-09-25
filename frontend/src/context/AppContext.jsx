import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AppContext = createContext(null);

const initialState = {
  loading: true,
  error: null,
  fields: [],
  summaryStats: {
    totalFields: 0,
    criticalFields: 0,
    highRiskFields: 0,
    moderateFields: 0,
    lowRiskFields: 0,
    avgRiskScore: 0,
    avgEC: 0,
    connectedSensors: 0
  },
  regions: [],
  trends: null,
  crops: [],
  selectedFieldId: null,
  analyzerResult: null,
  analyzerInputs: null,
  sidebarCollapsed: false,
  notifications: [
    {
      id: 'n1',
      type: 'critical',
      title: 'CRITICAL: Sri Ganganagar',
      message: 'EC has reached 6.8 dS/m — immediate intervention required.',
      timestamp: '2026-08-04T08:00:00Z',
      read: false,
    },
    {
      id: 'n2',
      type: 'warning',
      title: 'High Risk: Sirsa District',
      message: 'Water table has risen to 2.0m — capillary salt rise accelerating.',
      timestamp: '2026-08-04T07:30:00Z',
      read: false,
    },
    {
      id: 'n3',
      type: 'info',
      title: 'Monthly Report Ready',
      message: 'July 2026 regional salinity analysis report is available.',
      timestamp: '2026-08-01T09:00:00Z',
      read: true,
    },
  ],
};

const calculateSummaryStats = (fields) => {
  if (!fields.length) return initialState.summaryStats;
  return {
    totalFields: fields.length,
    criticalFields: fields.filter(f => f.riskLevel === 'CRITICAL').length,
    highRiskFields: fields.filter(f => f.riskLevel === 'HIGH').length,
    moderateFields: fields.filter(f => f.riskLevel === 'MODERATE').length,
    lowRiskFields: fields.filter(f => f.riskLevel === 'LOW').length,
    avgRiskScore: Math.round(fields.reduce((sum, f) => sum + f.riskScore, 0) / fields.length),
    avgEC: (fields.reduce((sum, f) => sum + f.metrics.ec, 0) / fields.length).toFixed(1),
    connectedSensors: fields.filter(f => f.sensorConnected).length,
  };
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        fields: action.payload.fields,
        summaryStats: calculateSummaryStats(action.payload.fields),
        regions: action.payload.regions,
        trends: action.payload.trends,
        crops: action.payload.crops
      };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SELECT_FIELD':
      return { ...state, selectedFieldId: action.payload };
    case 'SET_ANALYZER_RESULT':
      return {
        ...state,
        analyzerResult: action.payload.result,
        analyzerInputs: action.payload.inputs,
      };
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };
    case 'MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
      };
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const loadData = async () => {
      dispatch({ type: 'FETCH_START' });
      try {
        const [fieldsRes, regionsRes, trendsRes, cropsRes] = await Promise.all([
          fetch('/api/fields'),
          fetch('/api/regions'),
          fetch('/api/trends'),
          fetch('/api/crops')
        ]);
        
        const fields = await fieldsRes.json();
        const regions = await regionsRes.json();
        const trends = await trendsRes.json();
        const crops = await cropsRes.json();
        
        dispatch({ type: 'FETCH_SUCCESS', payload: { fields, regions, trends, crops } });
      } catch (err) {
        dispatch({ type: 'FETCH_ERROR', payload: err.message });
      }
    };
    
    loadData();
  }, []);

  const selectField = (id) => dispatch({ type: 'SELECT_FIELD', payload: id });
  const setAnalyzerResult = (result, inputs) =>
    dispatch({ type: 'SET_ANALYZER_RESULT', payload: { result, inputs } });
  const toggleSidebar = () => dispatch({ type: 'TOGGLE_SIDEBAR' });
  const markNotificationRead = (id) =>
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
  const markAllRead = () => dispatch({ type: 'MARK_ALL_READ' });

  return (
    <AppContext.Provider value={{ state, selectField, setAnalyzerResult, toggleSidebar, markNotificationRead, markAllRead }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
