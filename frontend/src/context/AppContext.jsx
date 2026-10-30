import { createContext, useContext, useReducer, useEffect } from 'react';
import { getApiUrl } from '../utils/api';
import { getTranslation } from '../utils/i18n';
export const AppContext = createContext(null);
const savedRole = typeof window !== 'undefined' ? (localStorage.getItem('terrasal_role') || 'panchayat') : 'panchayat';
const savedFarmerId = typeof window !== 'undefined' ? localStorage.getItem('terrasal_farmer_id') : null;
const savedLang = typeof window !== 'undefined' ? (localStorage.getItem('terrasal_lang') || 'en') : 'en';
const savedTheme = typeof window !== 'undefined' ? (localStorage.getItem('terrasal_theme') || 'light') : 'light';
const initialState = {
  loading: true,
  error: null,
  theme: savedTheme,
  role: savedRole,
  farmerId: savedFarmerId,
  isLoginModalOpen: false,
  language: savedLang,
  fields: [],
  activeFarmId: savedFarmerId,
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
      message: 'EC has reached 6.8 dS/m. Immediate intervention required.',
      timestamp: '2026-08-04T08:00:00Z',
      read: false,
    },
    {
      id: 'n2',
      type: 'warning',
      title: 'High Risk: Sirsa District',
      message: 'Water table has risen to 2.0m, increasing capillary salt rise.',
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
    case 'SET_ROLE':
      return { ...state, role: action.payload };
    case 'LOGIN_PANCHAYAT':
      return { ...state, role: 'panchayat', isLoginModalOpen: false };
    case 'LOGIN_FARMER':
      return {
        ...state,
        role: 'farmer',
        farmerId: action.payload,
        activeFarmId: action.payload,
        selectedFieldId: action.payload,
        isLoginModalOpen: false
      };
    case 'OPEN_LOGIN_MODAL':
      return { ...state, isLoginModalOpen: true };
    case 'CLOSE_LOGIN_MODAL':
      return { ...state, isLoginModalOpen: false };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
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
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    default:
      return state;
  }
};
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('terrasal_theme', state.theme);
  }, [state.theme]);
  useEffect(() => {
    localStorage.setItem('terrasal_role', state.role);
    if (state.farmerId) {
      localStorage.setItem('terrasal_farmer_id', state.farmerId);
    }
  }, [state.role, state.farmerId]);
  useEffect(() => {
    localStorage.setItem('terrasal_lang', state.language);
  }, [state.language]);
  const loadData = async (targetActiveId = null) => {
    dispatch({ type: 'FETCH_START' });
    try {
      const [fieldsRes, regionsRes, trendsRes, cropsRes] = await Promise.all([
        fetch(getApiUrl('/api/fields')),
        fetch(getApiUrl('/api/regions')),
        fetch(getApiUrl('/api/trends')),
        fetch(getApiUrl('/api/crops'))
      ]);
      if (!fieldsRes.ok || !regionsRes.ok || !trendsRes.ok || !cropsRes.ok) {
        throw new Error('Unable to connect to TerraSal backend API. Please ensure the backend is running and reachable.');
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
  const toggleTheme = () => dispatch({ type: 'TOGGLE_THEME' });
  const setTheme = (t) => dispatch({ type: 'SET_THEME', payload: t });
  const setRole = (role) => dispatch({ type: 'SET_ROLE', payload: role });
  const setLanguage = (lang) => dispatch({ type: 'SET_LANGUAGE', payload: lang });
  const setActiveFarmId = (id) => dispatch({ type: 'SET_ACTIVE_FARM', payload: id });
  const openPinDropModal = () => dispatch({ type: 'OPEN_PIN_DROP_MODAL' });
  const closePinDropModal = () => dispatch({ type: 'CLOSE_PIN_DROP_MODAL' });
  const openLoginModal = () => dispatch({ type: 'OPEN_LOGIN_MODAL' });
  const closeLoginModal = () => dispatch({ type: 'CLOSE_LOGIN_MODAL' });
  const selectField = (id) => dispatch({ type: 'SELECT_FIELD', payload: id });
  const loginAsPanchayat = () => {
    dispatch({ type: 'LOGIN_PANCHAYAT' });
    localStorage.setItem('terrasal_role', 'panchayat');
  };
  const loginAsFarmer = (farmerId) => {
    dispatch({ type: 'LOGIN_FARMER', payload: farmerId });
    localStorage.setItem('terrasal_role', 'farmer');
    localStorage.setItem('terrasal_farmer_id', farmerId);
  };
  const addFarm = async (farmData) => {
    try {
      const res = await fetch(getApiUrl('/api/fields'), {
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
      const res = await fetch(getApiUrl(`/api/fields/${id}`), { method: 'DELETE' });
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
  const activeFarm = state.role === 'farmer'
    ? (state.fields.find(f => f.id === state.farmerId) || state.fields[0] || null)
    : (state.fields.find(f => f.id === state.activeFarmId) || state.fields[0] || null);
  const userFields = state.role === 'farmer'
    ? (activeFarm ? [activeFarm] : [])
    : state.fields;
  const t = (key) => getTranslation(state.language, key);
  return (
    <AppContext.Provider value={{
      state,
      theme: state.theme,
      role: state.role,
      farmerId: state.farmerId,
      isLoginModalOpen: state.isLoginModalOpen,
      language: state.language,
      setRole,
      loginAsPanchayat,
      loginAsFarmer,
      openLoginModal,
      closeLoginModal,
      setLanguage,
      t,
      toggleTheme,
      setTheme,
      activeFarm,
      userFields,
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