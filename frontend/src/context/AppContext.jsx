import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AppContext = createContext(null);

const initialState = {
  loading: true,
  error: null,
  fields: [],
  activeFarmId: null,
  isPinDropModalOpen: false,
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
    avgRiskScore: Math.round(fields.reduce((sum, f) => sum + (f.riskScore || 0), 0) / fields.length),
    avgEC: (fields.reduce((sum, f) => sum + (f.metrics?.ec || f.groundwaterEC || 0), 0) / fields.length).toFixed(1),
    connectedSensors: fields.filter(f => f.sensorConnected).length,
  };
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS': {
      const fields = action.payload.fields || [];
      const currentActiveStillExists = fields.some(f => f.id === state.activeFarmId);
      const newActiveId = currentActiveStillExists ? state.activeFarmId : (fields[0]?.id || null);
      return { 
        ...state, 
        loading: false, 
        fields,
        activeFarmId: newActiveId,
        summaryStats: calculateSummaryStats(fields),
        regions: action.payload.regions,
        trends: action.payload.trends,
        crops: action.payload.crops
      };
    }
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SET_ACTIVE_FARM':
      return { ...state, activeFarmId: action.payload, selectedFieldId: action.payload };
    case 'OPEN_PIN_DROP_MODAL':
      return { ...state, isPinDropModalOpen: true };
    case 'CLOSE_PIN_DROP_MODAL':
      return { ...state, isPinDropModalOpen: false };
    case 'SELECT_FIELD':
      return { ...state, selectedFieldId: action.payload, activeFarmId: action.payload };
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

  const loadData = async (targetActiveId = null) => {
    dispatch({ type: 'FETCH_START' });
    try {
      const [fieldsRes, regionsRes, trendsRes, cropsRes] = await Promise.all([
        fetch('/api/fields'),
        fetch('/api/regions'),
        fetch('/api/trends'),
        fetch('/api/crops')
      ]);
      
      if (!fieldsRes.ok || !regionsRes.ok || !trendsRes.ok || !cropsRes.ok) {
        throw new Error('Unable to connect to TerraSal backend server (port 3000). Please ensure backend is running.');
      }

      const fields = await fieldsRes.json();
      const regions = await regionsRes.json();
      const trends = await trendsRes.json();
      const crops = await cropsRes.json();
      
      dispatch({ type: 'FETCH_SUCCESS', payload: { fields, regions, trends, crops } });
      if (targetActiveId) {
        dispatch({ type: 'SET_ACTIVE_FARM', payload: targetActiveId });
      }
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: err.message || 'Connection to backend API failed' });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const setActiveFarmId = (id) => dispatch({ type: 'SET_ACTIVE_FARM', payload: id });
  const openPinDropModal = () => dispatch({ type: 'OPEN_PIN_DROP_MODAL' });
  const closePinDropModal = () => dispatch({ type: 'CLOSE_PIN_DROP_MODAL' });
  const selectField = (id) => dispatch({ type: 'SELECT_FIELD', payload: id });

  const addFarm = async (farmData) => {
    try {
      const res = await fetch('/api/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(farmData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register farm');
      await loadData(data.fieldId);
      closePinDropModal();
      return data;
    } catch (err) {
      console.error('Error adding farm:', err);
      throw err;
    }
  };

  const deleteFarm = async (id) => {
    try {
      const res = await fetch(`/api/fields/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete farm');
      await loadData();
    } catch (err) {
      console.error('Error deleting farm:', err);
      throw err;
    }
  };

  const setAnalyzerResult = (result, inputs) =>
    dispatch({ type: 'SET_ANALYZER_RESULT', payload: { result, inputs } });
  const toggleSidebar = () => dispatch({ type: 'TOGGLE_SIDEBAR' });
  const markNotificationRead = (id) =>
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
  const markAllRead = () => dispatch({ type: 'MARK_ALL_READ' });

  const activeFarm = state.fields.find(f => f.id === state.activeFarmId) || state.fields[0] || null;

  return (
    <AppContext.Provider value={{
      state,
      activeFarm,
      setActiveFarmId,
      openPinDropModal,
      closePinDropModal,
      addFarm,
      deleteFarm,
      selectField,
      setAnalyzerResult,
      toggleSidebar,
      markNotificationRead,
      markAllRead,
      refetch: loadData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
