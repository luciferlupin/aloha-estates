import React, { useState, useEffect } from 'react';
import { CRMStore, CampaignData } from '../services/store';
import { 
  Megaphone, 
  Settings, 
  Terminal, 
  RefreshCw, 
  Sparkles, 
  DollarSign, 
  Eye, 
  Users, 
  MousePointerClick, 
  TrendingUp,
  Link
} from 'lucide-react';

export const MetaCampaigns: React.FC = () => {
  const [campData, setCampData] = useState<CampaignData>({ spend: 0, impressions: 0, leads: 0, ctr: 0, costPerLead: 0 });
  const [webhookLog, setWebhookLog] = useState<string>('// Webhook listening for Facebook Ad form events...\n// Waiting for Lead Form webhook trigger...');
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = () => {
    setCampData(CRMStore.getCampaignData());
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerSimulatedSync = () => {
    setIsSyncing(true);
    // Simulate webhook lead insertion
    setTimeout(() => {
      const newLead = CRMStore.simulateMetaLead();
      loadData();
      
      const webhookPayload = {
        object: 'page',
        entry: [
          {
            id: '10928374829302',
            time: Math.floor(Date.now() / 1000),
            changes: [
              {
                field: 'leadgen',
                value: {
                  ad_id: '2385928374920',
                  form_id: '928472910482',
                  leadgen_id: newLead.id,
                  created_time: Math.floor(Date.now() / 1000),
                  page_id: '1029384758',
                  adgroup_id: '3847291048',
                  raw_data: {
                    name: newLead.name,
                    email: newLead.email,
                    phone: newLead.phone,
                    budget: newLead.budget,
                    interested_property: newLead.propertyInterest,
                    source: 'Facebook Ad Form - Q3 Luxury Launch'
                  }
                }
              }
            ]
          }
        ]
      };

      setWebhookLog(JSON.stringify(webhookPayload, null, 2));
      setIsSyncing(false);
    }, 1200);
  };

  const campaigns = [
    { name: 'Q3 Premium Bungalows Mumbai', status: 'Active', leads: 82, ctr: '3.6%', spend: '$2,150' },
    { name: 'Goa Luxury Beachside Villas', status: 'Active', leads: 64, ctr: '4.2%', spend: '$1,800' },
    { name: 'Gurgaon Penthouse Launch', status: 'Active', leads: 38, ctr: '2.4%', spend: '$900' }
  ];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1.5rem'
      }}>
        <div>
          <h1 className="luxury-title" style={{ fontSize: '2.25rem', fontWeight: 600, color: 'var(--accent-black)' }}>
            Meta Campaigns Manager
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Monitor ad performance, campaign budgets, and real-time Facebook Lead Form webhook pipelines.
          </p>
        </div>
      </div>

      {/* Main Grid: Statistics */}
      <div className="grid-5">
        <div className="premium-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', color: 'var(--text-secondary)', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <DollarSign size={14} /> Total Budget Spend
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>${campData.spend}</div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>YTD campaign spend</span>
        </div>

        <div className="premium-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', color: 'var(--text-secondary)', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <Eye size={14} /> Impressions
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{campData.impressions.toLocaleString()}</div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Total user impressions</span>
        </div>

        <div className="premium-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', color: 'var(--text-secondary)', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <Users size={14} /> Leads Generated
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{campData.leads}</div>
          <span style={{ fontSize: '0.7rem', color: 'var(--accent-green)', fontWeight: 600 }}>Sync online</span>
        </div>

        <div className="premium-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', color: 'var(--text-secondary)', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <MousePointerClick size={14} /> Click-Through (CTR)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{campData.ctr}%</div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Average ad click-through rate</span>
        </div>

        <div className="premium-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', color: 'var(--text-secondary)', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
            <TrendingUp size={14} /> Cost Per Lead (CPL)
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>${campData.costPerLead}</div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Average cost per active lead</span>
        </div>
      </div>

      {/* Main split: Campaigns list vs Webhook debugger console */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        
        {/* Left Side: Campaign list */}
        <div className="premium-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Active Facebook Ads Campaigns</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Live listing status on Meta Networks</p>
            </div>
            <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Link size={12} /> Sync Active
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {campaigns.map((c, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                    <span>Budget: <strong>{c.spend}</strong></span>
                    <span>Leads: <strong>{c.leads}</strong></span>
                    <span>CTR: <strong>{c.ctr}</strong></span>
                  </div>
                </div>
                <span className="badge badge-black" style={{ fontSize: '0.65rem' }}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Webhook Simulation logger */}
        <div className="premium-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Terminal size={16} /> Webhook API Debugger
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Facebook instant forms payload console</p>
            </div>
            
            <button 
              onClick={triggerSimulatedSync} 
              disabled={isSyncing} 
              className="btn-secondary" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '6px' }}
            >
              {isSyncing ? (
                <>
                  <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> Processing...
                </>
              ) : (
                <>
                  <Sparkles size={12} /> Fire Webhook Sim
                </>
              )}
            </button>
          </div>

          <pre style={{
            flex: 1,
            backgroundColor: '#000000',
            color: '#a9b7c6',
            padding: '1rem',
            borderRadius: '10px',
            fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, Courier, monospace',
            fontSize: '0.75rem',
            overflow: 'auto',
            maxHeight: '300px',
            border: '1px solid #333',
            textAlign: 'left'
          }}>
            <code>{webhookLog}</code>
          </pre>

          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '-0.5rem' }}>
            Firing the Webhook injects a real lead into the CRM Database in real time.
          </span>
        </div>

      </div>

      {/* WhatsApp Integration Panel */}
      <div className="premium-card" style={{ marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ color: 'var(--accent-green)' }}>
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.644 1.97 14.178.95c-5.443 0-9.859 4.37-9.863 9.8-.001 1.83.488 3.619 1.416 5.176l-.988 3.606 3.692-.958zm12.333-6.626c-.33-.164-1.953-.952-2.253-1.061-.3-.11-.518-.164-.736.164-.218.329-.844 1.061-1.034 1.28-.19.219-.38.247-.71.082-.33-.164-1.393-.506-2.653-1.619-.98-.862-1.642-1.928-1.834-2.256-.192-.328-.02-.505.145-.668.148-.147.33-.383.495-.575.165-.192.22-.328.33-.548.11-.219.055-.41-.028-.574-.082-.164-.736-1.751-1.008-2.403-.265-.637-.53-.55-.736-.56-.189-.01-.408-.01-.626-.01-.218 0-.573.081-.873.41-.3.328-1.146 1.108-1.146 2.7 0 1.59 1.173 3.125 1.336 3.344.164.22 2.308 3.475 5.59 4.877.78.332 1.39.53 1.867.68.784.246 1.498.211 2.062.127.629-.094 1.953-.787 2.226-1.546.272-.76.272-1.411.19-1.547-.082-.136-.3-.218-.63-.382z"/>
              </svg>
              WhatsApp API Gateway Integration
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Configure WhatsApp Business notifications and direct click-to-chat client follow-up gateways.</p>
          </div>
          <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span className="status-dot active"></span> Gateway Online
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginTop: '0.5rem' }}>
          <div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              padding: '1rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-secondary)',
              fontSize: '0.85rem'
            }}>
              <div>Registered Owner: <strong>Prabal Luthra (Superadmin)</strong></div>
              <div>WhatsApp Number: <strong>+91 88518 22764</strong></div>
              <div>API Status: <strong style={{ color: 'var(--accent-green)' }}>CONNECTED</strong></div>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Verify the WhatsApp click-to-chat integration by sending a test message directly to Prabal Luthra's WhatsApp inbox.
                </p>
                <button 
                  onClick={() => {
                    const msg = "Aloha Estates CRM: Test message from your workspace dashboard. CRM WhatsApp click-to-chat is fully operational! 🚀";
                    window.open(`https://api.whatsapp.com/send?phone=918851822764&text=${encodeURIComponent(msg)}`, '_blank');
                  }} 
                  className="btn-primary" 
                  style={{ width: '100%', backgroundColor: 'var(--accent-green)', borderColor: 'var(--accent-green)', fontSize: '0.8rem', padding: '0.5rem' }}
                >
                  Send Sandbox Test Message
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Live Gateway Logs</div>
            <pre style={{
              flex: 1,
              backgroundColor: '#000000',
              color: '#34c759',
              padding: '0.85rem',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '0.7rem',
              maxHeight: '180px',
              overflow: 'auto',
              border: '1px solid #333',
              textAlign: 'left'
            }}>
              <code>
                {`[${new Date().toLocaleDateString()}] Initializing WhatsApp API Gateway...\n` +
                 `[${new Date().toLocaleDateString()}] Hooking webhook handler to port 9002...\n` +
                 `[${new Date().toLocaleDateString()}] Connecting instance 918851822764...\n` +
                 `[${new Date().toLocaleDateString()}] Client authenticated. Connection: ACTIVE.\n` +
                 `[${new Date().toLocaleDateString()}] Ready to dispatch real estate brochures & views.`}
              </code>
            </pre>
          </div>
        </div>
      </div>

    </div>
  );
};
