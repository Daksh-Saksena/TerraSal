import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');
class AIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }
  getApiKey() {
    return this.apiKey || process.env.OPENAI_API_KEY || '';
  }
  setApiKey(key) {
    this.apiKey = (key || '').trim();
    process.env.OPENAI_API_KEY = this.apiKey;
    try {
      let envContent = '';
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
      if (envContent.includes('OPENAI_API_KEY=')) {
        envContent = envContent.replace(/OPENAI_API_KEY=.*(\r?\n|$)/, `OPENAI_API_KEY=${this.apiKey}$1`);
      } else {
        envContent += `\nOPENAI_API_KEY=${this.apiKey}\nOPENAI_MODEL=gpt-4o-mini\n`;
      }
      fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf8');
    } catch (err) {
      console.warn('[AIService] Failed to write key to .env file:', err.message);
    }
  }
  isConfigured() {
    return Boolean(this.getApiKey() && this.getApiKey().startsWith('sk-'));
  }
  getStatus() {
    const key = this.getApiKey();
    const isConfigured = this.isConfigured();
    const masked = key && key.length > 8 ? `${key.slice(0, 7)}...${key.slice(-4)}` : null;
    return {
      configured: isConfigured,
      model: this.model,
      maskedKey: masked
    };
  }
  async generateVillagePeerIntelligence(fields = [], villageStats = {}) {
    const apiKey = this.getApiKey();
    if (!this.isConfigured()) {
      return this.generateDynamicFallback(fields, villageStats, 'Generated via TerraSal Agronomic Extension Matrix');
    }
    try {
      const fieldSummaries = fields.map(f => ({
        farmer: f.farmerName || f.name,
        location: f.location,
        crop: f.cropType,
        soil: f.soilType,
        irrigation: f.irrigationMethod,
        groundwaterEC: `${f.groundwaterEC} dS/m`,
        waterTableDepth: `${f.waterTableDepth} m`,
        soilStrain: f.soilStrain,
        recovery: `${f.soilRecovery}%`,
        riskLevel: f.riskLevel
      }));
      const prompt = `You are a Senior Agronomist and Soil Salinity Specialist for South Asian irrigated agricultural basins (Punjab, Haryana, Rajasthan).
We are analyzing collective village panchayat farm plots.
DATA & TELEMETRY STREAM CONTEXT:
- All monitored fields receive automated in-situ soil EC and water table depth sensor telemetry.
- Recommend practical farm management interventions based on available sensor data.
- Calibrate recommendations dynamically: schedule pre-sowing leaching irrigation before the next crop cycle, reduce irrigation volume by 20-25% for high-risk/shallow plots to halt capillary salt surges, and leverage root-zone EC logs to monitor salt flush velocity.
Village Aggregates:
- Active plots: ${fields.length}
- Average Soil Recovery: ${villageStats.avgRecovery || 'N/A'}%
- Average Root Strain: ${villageStats.avgStrain || 'N/A'} / 21
- Seasonal Salt Burden: ${villageStats.villageSaltTons || 'N/A'} tons
Individual Monitored Plots:
${JSON.stringify(fieldSummaries, null, 2)}
TASK:
Analyze the cross-field trends, identify which specific farmers are succeeding with good practices (e.g. drip, gypsum, drainage) vs those struggling with flood irrigation, shallow water tables, or high EC.
Produce exactly 3 distinct, highly actionable agronomic insights for the village:
1. Peer Irrigation / Management Best Practice (comparing top-performing farmers with those on flood irrigation, e.g. reducing irrigation volume by 20-25%)
2. Water Table / Drainage Cluster Warning (identifying the shallowest water tables and capillary rise risk in specific plots, scheduling leaching irrigation before next crop)
3. Crop Rotation / Soil Amendment Opportunity (actionable crop swap or amendment strategy based on actual EC levels from in-situ sensor logs)
Return ONLY valid JSON matching this schema:
{
  "advisories": [
    {
      "id": "peer-1",
      "type": "peer_irrigation",
      "badge": "Peer Irrigation Best Practice",
      "highlight": "drip-highlight",
      "title": "Short title",
      "message": "Detailed 2-3 sentence finding naming specific farmers from the data, their numbers, and comparison",
      "action": "Recommended Action: Specific quantified step for neighboring farmers"
    },
    {
      "id": "peer-2",
      "type": "water_table_warning",
      "badge": "Canal Cluster Water Table Warning",
      "highlight": "warning-highlight",
      "title": "Short title",
      "message": "Detailed finding about shallow water table plots and capillary salt buildup",
      "action": "Recommended Action: Concrete drainage or seasonal timing measure"
    },
    {
      "id": "peer-3",
      "type": "crop_rotation",
      "badge": "Crop Rotation Opportunity",
      "highlight": "info-highlight",
      "title": "Short title",
      "message": "Detailed finding about crop salt tolerance thresholds for the crops in the plots",
      "action": "Recommended Action: Specific crop swap recommendation (e.g. Barley, Sugar Beet, Safflower)"
    }
  ]
}`;
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert soil salinity agronomist. Always respond with pure JSON only, without markdown fences or additional conversational text.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      const content = response.data.choices[0].message.content;
      const parsed = JSON.parse(content);
      const advisories = (parsed.advisories || []).map((a, idx) => ({
        ...a,
        id: a.id || `ai-${idx + 1}`,
        aiGenerated: true,
        model: this.model
      }));
      return {
        success: true,
        source: 'gpt-4o-mini',
        advisories
      };
    } catch (error) {
      console.error('[AIService] OpenAI API call failed:', error.response?.data || error.message);
      return this.generateDynamicFallback(
        fields,
        villageStats,
        `Agronomic advisory generated via local extension matrix`
      );
    }
  }
  generateDynamicFallback(fields = [], villageStats = {}, fallbackReason = '') {
    if (!fields || fields.length === 0) {
      return {
        success: false,
        source: 'fallback',
        reason: 'No fields available to analyze',
        advisories: []
      };
    }
    const sortedByRecovery = [...fields].sort((a, b) => (b.soilRecovery || 0) - (a.soilRecovery || 0));
    const bestDrip = sortedByRecovery.find(f => f.irrigationMethod === 'drip') || sortedByRecovery[0];
    const strugglingFlood = [...fields].reverse().find(f => f.irrigationMethod === 'flood' || f.irrigationMethod === 'canal') || sortedByRecovery[sortedByRecovery.length - 1];
    const shallowPlots = fields.filter(f => (f.waterTableDepth || 5) <= 1.8);
    const highSalinePlots = fields.filter(f => (f.groundwaterEC || 0) >= 4.0);
    const advisories = [];
    if (bestDrip && strugglingFlood) {
      advisories.push({
        id: 'peer-dyn-1',
        type: 'peer_irrigation',
        badge: 'Peer Irrigation Best Practice',
        highlight: 'drip-highlight',
        title: 'Precision Drip vs. Flood Leaching Protocol',
        message: `${bestDrip.farmerName} is maintaining ${bestDrip.soilRecovery}% Soil Recovery on ${bestDrip.cropType} using ${bestDrip.irrigationMethod} irrigation. In contrast, ${strugglingFlood.farmerName} on flood irrigation is experiencing high root strain (${strugglingFlood.soilStrain} load).`,
        action: `Recommended Action: Neighboring farmers on flood irrigation can transition to drip fertigation to reduce water usage by ~45% and prevent salt accumulation in the active root zone.`,
        aiGenerated: false,
        fallbackReason
      });
    }
    if (shallowPlots.length > 0) {
      const plotNames = shallowPlots.slice(0, 2).map(p => `${p.name} (${p.waterTableDepth}m)`).join(' and ');
      advisories.push({
        id: 'peer-dyn-2',
        type: 'water_table_warning',
        badge: 'Canal Cluster Water Table Warning',
        highlight: 'warning-highlight',
        title: 'Shallow Water Table & Capillary Rise Alert',
        message: `Plots including ${plotNames} have a critical water table depth under 1.8m. Capillary rise is drawing saline groundwater upwards into the root profile at an estimated 2.0-3.0 mm/day.`,
        action: `Recommended Action: Construct collective subsurface tile drainage along field borders before the next sowing season to lower the local water table.`,
        aiGenerated: false,
        fallbackReason
      });
    }
    if (highSalinePlots.length > 0) {
      const sample = highSalinePlots[0];
      advisories.push({
        id: 'peer-dyn-3',
        type: 'crop_rotation',
        badge: 'Crop Rotation Opportunity',
        highlight: 'info-highlight',
        title: 'Salt-Tolerant Variety Transition Window',
        message: `Plots like ${sample.name} have groundwater EC exceeding ${sample.groundwaterEC} dS/m, which stresses sensitive crops like ${sample.cropType}.`,
        action: `Recommended Action: Rotate to high salt-tolerant winter varieties such as Barley (up to 8.0 dS/m) or Sugar Beet to maintain up to 85% normal economic yield.`,
        aiGenerated: false,
        fallbackReason
      });
    }
    return {
      success: true,
      source: 'dynamic-matrix',
      advisories
    };
  }
}
export const aiService = new AIService();