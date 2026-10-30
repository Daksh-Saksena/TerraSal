// TerraSal Multi-language Dictionary (English, Hindi, Punjabi)
export const translations = {
  en: {
    appName: 'TerraSal',
    tagline: 'Root Zone Salinity Intelligence',
    panchayatPortal: 'Panchayat Soil Portal: Village-wide root zone salinity tracking',
    farmerPortal: 'My Farm Dashboard: Salinity & Soil Health Monitor',
    
    // Roles
    rolePanchayat: 'Panchayat Officer',
    roleFarmer: 'Individual Farmer',
    roleLabel: 'View Mode',
    switchRole: 'Switch Role',
    allPlots: 'All Village Plots',
    myPlot: 'My Farm Plot',
    
    // Navigation
    navDashboard: 'Dashboard',
    navVillage: 'Village Overview',
    navMap: 'Field Map',
    navAnalyzer: 'Salinity Diagnostic',
    navTrends: 'Trends & Telemetry',
    navRecommendations: 'Action Plans',
    navSettings: 'Settings',

    // Soil & Salinity metrics
    soilHealth: 'Soil Health',
    soilRecovery: 'Soil Recovery',
    soilStrain: 'Soil Strain',
    salinityLevel: 'Salinity (EC)',
    waterTableDepth: 'Water Table Depth',
    riskScore: 'Salinity Risk',
    cropType: 'Crop Type',
    soilType: 'Soil Type',
    irrigationMethod: 'Irrigation Method',
    lastUpdated: 'Last Updated',
    sensorActive: 'Live IoT Sensor',
    sensorManual: 'Manual Survey',

    // Risk levels
    CRITICAL: 'Critical',
    HIGH: 'High Risk',
    MODERATE: 'Moderate',
    LOW: 'Low Risk / Optimal',

    // KPIs
    avgRiskScore: 'Avg Risk Score',
    avgEC: 'Avg Groundwater EC',
    criticalFields: 'Critical Fields',
    connectedSensors: 'Active Sensors',
    safeThreshold: 'Safe threshold: 2.0 dS/m',
    totalArea: 'Total Monitored Area',
    acres: 'Acres',

    // Actions & Tools
    pinDropTitle: 'Register New Farm',
    exportReport: 'Export Report',
    exportCSV: 'Export CSV',
    printReport: 'Print Advisory',
    runAnalysis: 'Run Diagnostic',
    whatIfSimulator: 'What-If Crop & Leaching Simulator',
    labCalibration: 'Soil Lab-Test Calibration',

    // Weather & Irrigation Advice
    weatherForecast: '7-Day Salinity & Rain Forecast',
    leachAdviceRain: 'Rain forecast in 48h! Postpone flood irrigation to let natural rainwater flush salts.',
    leachAdviceDry: 'Dry conditions ahead. Schedule controlled leaching cycle with adequate drainage.',

    // Common
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    farmer: 'Farmer',
    location: 'Location',
    actions: 'Actions',
  },
  hi: {
    appName: 'टेरासाल',
    tagline: 'मिट्टी लवणीयता और स्वास्थ्य निगरानी प्रणाली',
    panchayatPortal: 'पंचायत मृदा पोर्टल: पूरे गांव के खेतों की लवणीयता निगरानी',
    farmerPortal: 'मेरा खेत डैशबोर्ड: लवणीयता और मिट्टी स्वास्थ्य स्थिति',

    // Roles
    rolePanchayat: 'पंचायत / कृषि अधिकारी',
    roleFarmer: 'किसान दृश्य (मेरा खेत)',
    roleLabel: 'मोड चुनें',
    switchRole: 'मोड बदलें',
    allPlots: 'गांव के सभी खेत',
    myPlot: 'मेरा खेत',

    // Navigation
    navDashboard: 'डैशबोर्ड',
    navVillage: 'ग्राम अवलोकन',
    navMap: 'खेत का नक्शा',
    navAnalyzer: 'लवणीयता जांच (डायग्नोस्टिक)',
    navTrends: 'रुझान और सेंसर डेटा',
    navRecommendations: 'सुझाव एवं उपाय',
    navSettings: 'सेटिंग्स',

    // Soil & Salinity metrics
    soilHealth: 'मिट्टी स्वास्थ्य',
    soilRecovery: 'मृदा सुधार दर (Recovery)',
    soilStrain: 'मिट्टी पर तनाव (Strain)',
    salinityLevel: 'लवणीयता (EC मान)',
    waterTableDepth: 'भूजल स्तर (गहराई)',
    riskScore: 'लवणीयता जोखिम',
    cropType: 'फसल का प्रकार',
    soilType: 'मिट्टी की किस्म',
    irrigationMethod: 'सिंचाई का तरीका',
    lastUpdated: 'अंतिम अपडेट',
    sensorActive: 'लाइव सेंसर चालू',
    sensorManual: 'मैन्युअल सर्वेक्षण',

    // Risk levels
    CRITICAL: 'गंभीर (Critical)',
    HIGH: 'उच्च जोखिम (High)',
    MODERATE: 'मध्यम (Moderate)',
    LOW: 'सामान्य / सुरक्षित (Safe)',

    // KPIs
    avgRiskScore: 'औसत जोखिम स्कोर',
    avgEC: 'औसत भूजल EC',
    criticalFields: 'गंभीर खेत',
    connectedSensors: 'सक्रिय सेंसर',
    safeThreshold: 'सुरक्षित सीमा: 2.0 dS/m',
    totalArea: 'कुल निगरानी क्षेत्र',
    acres: 'एकड़',

    // Actions & Tools
    pinDropTitle: 'नया खेत जोड़ें',
    exportReport: 'रिपोर्ट डाउनलोड करें',
    exportCSV: 'CSV डाउनलोड करें',
    printReport: 'सलाह पर्ची प्रिंट करें',
    runAnalysis: 'जांच शुरू करें',
    whatIfSimulator: 'फसल बदलाव और लीचिंग सिम्युलेटर',
    labCalibration: 'मृदा प्रयोगशाला (Lab) परीक्षण जोड़ें',

    // Weather & Irrigation Advice
    weatherForecast: '7-दिवसीय मौसम एवं वर्षा पूर्वानुमान',
    leachAdviceRain: 'अगले 48 घंटे में बारिश की संभावना! नमक बहाने हेतु बारिश के पानी का उपयोग करें, नहरी सिंचाई टालें।',
    leachAdviceDry: 'आगामी दिन सूखे रहेंगे। मिट्टी से नमक निकालने हेतु नियंत्रित लीचिंग की योजना बनाएं।',

    // Common
    loading: 'लोड हो रहा है...',
    save: 'सुरक्षित करें',
    cancel: 'रद्द करें',
    farmer: 'किसान',
    location: 'स्थान',
    actions: 'कार्रवाई',
  },
  pa: {
    appName: 'ਟੇਰਾਸਾਲ',
    tagline: 'ਮਿੱਟੀ ਦਾ ਖਾਰਾਪਣ ਅਤੇ ਸਿਹਤ ਨਿਗਰਾਨੀ ਪ੍ਰਣਾਲੀ',
    panchayatPortal: 'ਪੰਚਾਇਤ ਸੋਇਲ ਪੋਰਟਲ: ਪਿੰਡ ਦੇ ਸਾਰੇ ਖੇਤਾਂ ਦੀ ਨਿਗਰਾਨੀ',
    farmerPortal: 'ਮੇਰਾ ਖੇਤ ਡੈਸ਼ਬੋਰਡ: ਖਾਰਾਪਣ ਅਤੇ ਮਿੱਟੀ ਦੀ ਸਿਹਤ',

    // Roles
    rolePanchayat: 'ਪੰਚਾਇਤ / ਖੇਤੀਬਾੜੀ ਅਧਿਕਾਰੀ',
    roleFarmer: 'ਕਿਸਾਨ ਵਿਊ (ਮੇਰਾ ਖੇਤ)',
    roleLabel: 'ਮੋਡ ਚੁਣੋ',
    switchRole: 'ਮੋਡ ਬਦਲੋ',
    allPlots: 'ਪਿੰਡ ਦੇ ਸਾਰੇ ਪਲਾਟ',
    myPlot: 'ਮੇਰਾ ਖੇਤ ਪਲਾਟ',

    // Navigation
    navDashboard: 'ਡੈਸ਼ਬੋਰਡ',
    navVillage: 'ਪਿੰਡ ਦਾ ਜਾਇਜ਼ਾ',
    navMap: 'ਖੇਤ ਦਾ ਨਕਸ਼ਾ',
    navAnalyzer: 'ਖਾਰੇਪਣ ਦੀ ਜਾਂਚ',
    navTrends: 'ਰੁਝਾਨ ਅਤੇ ਸੈਂਸਰ ਡਾਟਾ',
    navRecommendations: 'ਸੁਝਾਅ ਅਤੇ ਹੱਲ',
    navSettings: 'ਸੈਟਿੰਗਜ਼',

    // Soil & Salinity metrics
    soilHealth: 'ਮਿੱਟੀ ਦੀ ਸਿਹਤ',
    soilRecovery: 'ਮਿੱਟੀ ਸੁਧਾਰ (ਰਿਕਵਰੀ)',
    soilStrain: 'ਮਿੱਟੀ ਤੇ ਤਣਾਅ',
    salinityLevel: 'ਖਾਰਾਪਣ (EC ਮਾਪ)',
    waterTableDepth: 'ਜ਼ਮੀਨੀ ਪਾਣੀ ਦਾ ਪੱਧਰ',
    riskScore: 'ਖਾਰੇਪਣ ਦਾ ਖ਼ਤਰਾ',
    cropType: 'ਫ਼ਸਲ ਦੀ ਕਿਸਮ',
    soilType: 'ਮਿੱਟੀ ਦੀ ਕਿਸਮ',
    irrigationMethod: 'ਸਿੰਚਾਈ ਦਾ ਤਰੀਕਾ',
    lastUpdated: 'ਤਾਜ਼ਾ ਜਾਣਕਾਰੀ',
    sensorActive: 'ਲਾਈਵ ਸੈਂਸਰ ਚਾਲੂ',
    sensorManual: 'ਮੈਨੂਅਲ ਸਰਵੇਖਣ',

    // Risk levels
    CRITICAL: 'ਨਾਜ਼ੁਕ (Critical)',
    HIGH: 'ਉੱਚ ਖ਼ਤਰਾ (High)',
    MODERATE: 'ਦਰਮਿਆਨਾ (Moderate)',
    LOW: 'ਸੁਰੱਖਿਅਤ / ਠੀਕ (Safe)',

    // KPIs
    avgRiskScore: 'ਔਸਤ ਖ਼ਤਰਾ ਸਕੋਰ',
    avgEC: 'ਔਸਤ ਪਾਣੀ EC',
    criticalFields: 'ਨਾਜ਼ੁਕ ਖੇਤ',
    connectedSensors: 'ਚਾਲੂ ਸੈਂਸਰ',
    safeThreshold: 'ਸੁਰੱਖਿਅਤ ਮਾਪ: 2.0 dS/m',
    totalArea: 'ਕੁੱਲ ਨਿਗਰਾਨੀ ਹੇਠ ਰਕਬਾ',
    acres: 'ਏਕੜ',

    // Actions & Tools
    pinDropTitle: 'ਨਵਾਂ ਖੇਤ ਦਰਜ ਕਰੋ',
    exportReport: 'ਰਿਪੋਰਟ ਡਾਊਨਲੋਡ ਕਰੋ',
    exportCSV: 'CSV ਡਾਊਨਲੋਡ ਕਰੋ',
    printReport: 'ਸਲਾਹ ਪੱਤਰ ਪ੍ਰਿੰਟ ਕਰੋ',
    runAnalysis: 'ਜਾਂਚ ਸ਼ੁਰੂ ਕਰੋ',
    whatIfSimulator: 'ਫ਼ਸਲ ਬਦਲਣ ਅਤੇ ਲੀਚਿੰਗ ਸਿਮੂਲੇਟਰ',
    labCalibration: 'ਮਿੱਟੀ ਲੈਬ ਟੈਸਟ ਰਿਪੋਰਟ ਦਰਜ ਕਰੋ',

    // Weather & Irrigation Advice
    weatherForecast: '7 ਦਿਨਾਂ ਦਾ ਮੌਸਮ ਅਤੇ ਮੀਂਹ ਦਾ ਅਨੁਮਾਨ',
    leachAdviceRain: 'ਅਗਲੇ 48 ਘੰਟਿਆਂ ਵਿੱਚ ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ! ਖਾਰਾਪਣ ਧੋਣ ਲਈ ਮੀਂਹ ਦੇ ਪਾਣੀ ਦਾ ਲਾਹਾ ਲਓ, ਸਿੰਚਾਈ ਰੋਕੋ।',
    leachAdviceDry: 'ਅੱਗੇ ਮੌਸਮ ਖੁਸ਼ਕ ਰਹੇਗਾ। ਮਿੱਟੀ ਵਿਚੋਂ ਲੂਣ ਕੱਢਣ ਲਈ ਲੀਚਿੰਗ ਦਾ ਪ੍ਰਬੰਧ ਕਰੋ।',

    // Common
    loading: 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...',
    save: 'ਸੇਵ ਕਰੋ',
    cancel: 'ਰੱਦ ਕਰੋ',
    farmer: 'ਕਿਸਾਨ',
    location: 'ਪਿੰਡ / ਥਾਂ',
    actions: 'ਕਾਰਵਾਈ',
  }
};

export function getTranslation(lang, key) {
  const selected = translations[lang] || translations.en;
  return selected[key] || translations.en[key] || key;
}

