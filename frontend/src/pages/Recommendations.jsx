import React, { useState } from 'react';
import {
  BookOpen, Sprout, Droplets, Layers, ExternalLink,
  ChevronDown, ChevronUp, Download, CheckCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import './Recommendations.css';

const irrigationPractices = [
  {
    id: 'drip',
    title: 'Drip Irrigation',
    suitability: 'All saline conditions',
    ecRange: 'All EC levels',
    description: 'Delivers water directly to root zone at low pressure. Prevents salt accumulation on soil surface and reduces water contact with leaves. Reduces irrigation water requirement by 40–60%.',
    benefits: ['40–60% water savings', 'Precise salt management', 'Reduced crop stress', 'Fertilizer application (fertigation)'],
    limitations: ['Higher upfront cost', 'Requires clean water (filter needed)', 'Maintenance of emitters'],
    subsidy: 'PM-KUSUM / PMKSY: Up to 90% subsidy for marginal farmers',
    rating: 5,
  },
  {
    id: 'sprinkler',
    title: 'Sprinkler Irrigation',
    suitability: 'Moderate salinity',
    ecRange: 'EC < 4 dS/m',
    description: 'Simulates rainfall. Better than flood irrigation for salt management. Apply in early morning to allow foliar salts to wash off before high temperatures concentrate them.',
    benefits: ['30–40% water savings vs flood', 'Uniform coverage', 'Suitable for undulating terrain'],
    limitations: ['Foliar salt burn possible if water EC > 2 dS/m', 'Wind affects uniformity'],
    subsidy: 'PMKSY subsidy available',
    rating: 4,
  },
  {
    id: 'deficit',
    title: 'Deficit Irrigation',
    suitability: 'Moderate salinity with good drainage',
    ecRange: 'EC 2–5 dS/m',
    description: 'Irrigate at 70–80% of crop water requirement during non-critical growth stages. Allows mild water stress without significant yield loss while reducing salt loading.',
    benefits: ['Reduces salt accumulation', 'Water conservation', 'Can improve crop quality'],
    limitations: ['Requires accurate ET data', 'Risk if mis-timed during critical periods'],
    subsidy: null,
    rating: 3,
  },
  {
    id: 'leaching',
    title: 'Pre-sowing Leaching',
    suitability: 'High salinity fields',
    ecRange: 'EC > 4 dS/m',
    description: 'Apply 1.5–2× normal irrigation volume 15–20 days before sowing to flush accumulated salts below root zone. Requires adequate drainage infrastructure.',
    benefits: ['Reduces initial salt stress', 'Improves germination', 'Effective before each crop cycle'],
    limitations: ['Requires good drainage', 'Water intensive', 'Temporary solution'],
    subsidy: null,
    rating: 4,
  },
];

const soilTreatments = [
  {
    title: 'Gypsum Application (CaSO₄)',
    category: 'Chemical Amendment',
    targetSoil: 'Sodic / High-SAR soils',
    rate: '2–10 tonnes/ha depending on SAR',
    timing: 'Pre-sowing or post-harvest',
    steps: [
      'Get soil SAR tested at certified lab',
      'Calculate gypsum requirement (GR = 0.85 × SAR excess)',
      'Broadcast gypsum uniformly across field',
      'Incorporate to 15cm depth by tilling',
      'Apply leaching irrigation to move Ca²⁺ into soil profile',
      'Repeat annually for 2–3 years',
    ],
    cost: '₹5,000–25,000/ha',
    effectiveness: 'High for sodic soils',
  },
  {
    title: 'Green Manuring',
    category: 'Biological Amendment',
    targetSoil: 'All saline soils',
    rate: 'Dhaincha (Sesbania) — 15–20 kg seed/ha',
    timing: 'Between crop cycles (June–July)',
    steps: [
      'Sow Dhaincha or Sunhemp during inter-cropping period',
      'Allow to grow for 45–60 days',
      'Plough in at early flowering stage (before seed set)',
      'Allow 2–3 weeks for decomposition',
      'Proceed with regular crop establishment',
    ],
    cost: '₹2,000–4,000/ha',
    effectiveness: 'Moderate — improves soil structure & organic matter',
  },
  {
    title: 'Deep Ploughing',
    category: 'Physical Treatment',
    targetSoil: 'Salt-crusted / compact soils',
    rate: 'Subsoil ploughing to 40–50cm depth',
    timing: 'Pre-monsoon (May–June)',
    steps: [
      'Use chisel plough or deep tiller attachment',
      'Plough to 40–50cm depth (subsoil ploughing)',
      'Leave furrows open to allow rain and monsoon water to infiltrate',
      'Follow up with leaching irrigation',
      'Add organic matter before closing furrows',
    ],
    cost: '₹3,500–7,000/ha',
    effectiveness: 'High for breaking salt-hardpan layers',
  },
  {
    title: 'Organic Matter Addition (FYM)',
    category: 'Organic Amendment',
    targetSoil: 'All saline soils',
    rate: '10–15 tonnes FYM/ha',
    timing: 'Pre-sowing',
    steps: [
      'Apply well-composted FYM (Farm Yard Manure) at 10–15 t/ha',
      'Incorporate to 15–20cm depth during land preparation',
      'Supplement with vermicompost for premium results',
      'Repeat every season for cumulative benefit',
    ],
    cost: '₹8,000–15,000/ha',
    effectiveness: 'Moderate — long-term improvement in soil health',
  },
];

const govtSchemes = [
  {
    name: 'PM-KUSUM (Pradhan Mantri Kisan Urja Suraksha evam Utthaan Mahabhiyan)',
    ministry: 'Ministry of New & Renewable Energy',
    benefit: 'Solar pump installation for irrigation',
    subsidy: '90% subsidy (60% central + 30% state)',
    eligibility: 'Individual farmers with cultivable land',
    link: 'https://mnre.gov.in/pm-kusum/',
  },
  {
    name: 'PMKSY (Pradhan Mantri Krishi Sinchai Yojana)',
    ministry: 'Ministry of Jal Shakti',
    benefit: 'Drip & sprinkler irrigation subsidy',
    subsidy: 'Up to 55% for large farmers, 90% for small/marginal',
    eligibility: 'All farmers with land ownership documents',
    link: 'https://pmksy.gov.in/',
  },
  {
    name: 'Soil Health Card Scheme',
    ministry: 'Ministry of Agriculture',
    benefit: 'Free soil testing including EC, pH, nutrients',
    subsidy: 'Fully subsidized by government',
    eligibility: 'All farmers',
    link: 'https://soilhealth.dac.gov.in/',
  },
  {
    name: 'NMSA (National Mission for Sustainable Agriculture)',
    ministry: 'Ministry of Agriculture',
    benefit: 'Support for soil management, water conservation, organic farming',
    subsidy: 'Component-wise: 50–100% for different activities',
    eligibility: 'Farmers in targeted districts',
    link: 'https://nmsa.dac.gov.in/',
  },
];

export default function Recommendations() {
  const { state } = useApp();
  const cropDatabase = state.crops || [];

  const [activePage, setActivePage] = useState('crops');
  const [expandedTreatment, setExpandedTreatment] = useState(null);
  const [toleranceFilter, setToleranceFilter] = useState('all');

  const filteredCrops = toleranceFilter === 'all'
    ? cropDatabase
    : cropDatabase.filter(c => c.toleranceLevel === toleranceFilter);

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>Advisory Center</h1>
        <p>Science-based recommendations for salinity management and crop selection</p>
      </div>

      {/* Navigation Tabs */}
      <div className="rec-nav">
        {[
          { key: 'crops', icon: Sprout, label: 'Crop Guide' },
          { key: 'irrigation', icon: Droplets, label: 'Irrigation Practices' },
          { key: 'treatment', icon: Layers, label: 'Soil Treatment' },
          { key: 'schemes', icon: BookOpen, label: 'Govt. Schemes' },
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            className={`rec-nav-btn ${activePage === key ? 'active' : ''}`}
            onClick={() => setActivePage(key)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
        <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>
          <Download size={14} />
          Export PDF
        </button>
      </div>

      {/* Crop Guide */}
      {activePage === 'crops' && (
        <div className="fade-in">
          <div className="rec-section-header">
            <div>
              <h2>Salt Tolerance Guide</h2>
              <p>EC thresholds based on FAO guidelines. Choose crops suitable for your groundwater EC.</p>
            </div>
            <div className="tolerance-filter">
              {['all', 'very-high', 'high', 'moderate', 'low'].map(level => (
                <button
                  key={level}
                  className={`filter-btn ${toleranceFilter === level ? 'active' : ''}`}
                  onClick={() => setToleranceFilter(level)}
                >
                  {level === 'all' ? 'All' : level.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="crop-table-wrap">
              <table className="data-table crop-table">
                <thead>
                  <tr>
                    <th>Crop</th>
                    <th>Category</th>
                    <th>Tolerance</th>
                    <th>Safe EC Threshold</th>
                    <th>50% Yield Loss EC</th>
                    <th>Yield Reduction Rate</th>
                    <th>Season</th>
                    <th>Water Req.</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCrops.sort((a, b) => b.ecMaxTolerable - a.ecMaxTolerable).map(crop => (
                    <tr key={crop.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '1.1rem' }}>{crop.icon}</span>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                              {crop.name}
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              {crop.scientificName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td><span className="chip">{crop.category}</span></td>
                      <td>
                        <span className={`badge badge-${
                          crop.toleranceLevel === 'very-high' ? 'low' :
                          crop.toleranceLevel === 'high' ? 'moderate' :
                          crop.toleranceLevel === 'moderate' ? 'high' : 'critical'
                        }`}>
                          {crop.toleranceLevel.replace('-', ' ')}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontFamily: 'Space Grotesk',
                          fontWeight: 700,
                          color: crop.ecMaxTolerable >= 6 ? '#22c55e' : crop.ecMaxTolerable >= 4 ? '#f59e0b' : '#f97316'
                        }}>
                          {crop.ecMaxTolerable} dS/m
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{crop.ecThreshold50} dS/m</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{crop.yieldReduction}</td>
                      <td><span className="chip">{crop.season}</span></td>
                      <td>
                        <span className={`badge ${
                          crop.waterRequirement === 'low' ? 'badge-low' :
                          crop.waterRequirement === 'moderate' ? 'badge-moderate' : 'badge-high'
                        }`}>
                          {crop.waterRequirement}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="data-source-note">
            <BookOpen size={13} />
            Source: FAO Irrigation and Drainage Paper No. 29 — "Water quality for agriculture" (Ayers & Westcot, 1985). Data is indicative. Consult local KVK for region-specific recommendations.
          </div>
        </div>
      )}

      {/* Irrigation Practices */}
      {activePage === 'irrigation' && (
        <div className="irrigation-grid fade-in">
          {irrigationPractices.map(practice => (
            <div key={practice.id} className="card irrigation-practice-card">
              <div className="irr-practice-header">
                <div>
                  <h3>{practice.title}</h3>
                  <div className="irr-tags">
                    <span className="chip">{practice.suitability}</span>
                    <span className="chip" style={{ color: 'var(--color-teal)', borderColor: 'var(--border-accent)', background: 'var(--color-teal-dim)' }}>
                      {practice.ecRange}
                    </span>
                  </div>
                </div>
                <div className="irr-rating">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} style={{ color: i < practice.rating ? '#f59e0b' : 'rgba(255,255,255,0.1)', fontSize: '14px' }}>★</span>
                  ))}
                </div>
              </div>

              <p style={{ fontSize: '0.875rem' }}>{practice.description}</p>

              <div className="irr-details">
                <div className="irr-detail-col">
                  <div className="irr-detail-title">✅ Benefits</div>
                  {practice.benefits.map((b, i) => (
                    <div key={i} className="irr-detail-item good">{b}</div>
                  ))}
                </div>
                <div className="irr-detail-col">
                  <div className="irr-detail-title">⚠️ Limitations</div>
                  {practice.limitations.map((l, i) => (
                    <div key={i} className="irr-detail-item neutral">{l}</div>
                  ))}
                </div>
              </div>

              {practice.subsidy && (
                <div className="irr-subsidy-banner">
                  💰 <strong>Subsidy Available:</strong> {practice.subsidy}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Soil Treatment */}
      {activePage === 'treatment' && (
        <div className="treatment-list fade-in">
          {soilTreatments.map((treatment, i) => (
            <div key={i} className={`card treatment-item ${expandedTreatment === i ? 'expanded' : ''}`}>
              <button
                className="treatment-toggle"
                onClick={() => setExpandedTreatment(expandedTreatment === i ? null : i)}
              >
                <div className="treatment-toggle-left">
                  <div className="treatment-category">{treatment.category}</div>
                  <h3>{treatment.title}</h3>
                  <div className="treatment-meta">
                    <span className="chip">{treatment.targetSoil}</span>
                    <span className="chip">{treatment.timing}</span>
                    <span className="chip" style={{ color: 'var(--color-teal)', background: 'var(--color-teal-dim)', borderColor: 'var(--border-accent)' }}>
                      Est. Cost: {treatment.cost}
                    </span>
                  </div>
                </div>
                {expandedTreatment === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {expandedTreatment === i && (
                <div className="treatment-details fade-in">
                  <div className="divider" />
                  <div className="treatment-info-grid">
                    <div>
                      <div className="treatment-detail-label">Application Rate</div>
                      <div className="treatment-detail-val">{treatment.rate}</div>
                    </div>
                    <div>
                      <div className="treatment-detail-label">Effectiveness</div>
                      <div className="treatment-detail-val">{treatment.effectiveness}</div>
                    </div>
                  </div>
                  <div className="treatment-steps-title">Step-by-Step Protocol</div>
                  <div className="treatment-steps">
                    {treatment.steps.map((step, j) => (
                      <div key={j} className="treatment-step">
                        <div className="step-num">{j + 1}</div>
                        <div className="step-text">{step}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Govt Schemes */}
      {activePage === 'schemes' && (
        <div className="schemes-grid fade-in">
          {govtSchemes.map((scheme, i) => (
            <div key={i} className="card scheme-card">
              <div className="scheme-header">
                <div className="scheme-ministry">{scheme.ministry}</div>
                <h3>{scheme.name}</h3>
              </div>
              <div className="scheme-details">
                <div className="scheme-detail">
                  <span className="scheme-detail-label">Benefit</span>
                  <span className="scheme-detail-val">{scheme.benefit}</span>
                </div>
                <div className="scheme-detail">
                  <span className="scheme-detail-label">Subsidy</span>
                  <span className="scheme-detail-val" style={{ color: '#22c55e' }}>{scheme.subsidy}</span>
                </div>
                <div className="scheme-detail">
                  <span className="scheme-detail-label">Eligibility</span>
                  <span className="scheme-detail-val">{scheme.eligibility}</span>
                </div>
              </div>
              <a
                href={scheme.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto' }}
              >
                <ExternalLink size={13} />
                Visit Official Portal
              </a>
            </div>
          ))}
          <div className="card scheme-disclaimer">
            <CheckCircle size={16} color="#22c55e" />
            <p>Scheme details are indicative. Subsidy amounts, eligibility criteria, and application processes may change. Always verify with the official government portal or nearest Krishi Vigyan Kendra (KVK) before applying.</p>
          </div>
        </div>
      )}
    </div>
  );
}
