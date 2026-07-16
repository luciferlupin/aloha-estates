import { SupabaseSync } from './supabaseSync';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'agent';
  checkedIn: boolean;
  lastCheckIn: string | null;
  lastCheckOut: string | null;
}

export interface ClientEvent {
  id: string;
  type: 'status_change' | 'note_added' | 'reminder_set' | 'whatsapp_sent' | 'created';
  text: string;
  timestamp: string;
  userName: string;
}

export interface ClientComment {
  text: string;
  timestamp: string;
  author: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'lead' | 'contacted' | 'viewing' | 'negotiation' | 'closed';
  assignedAgentId: string;
  assignedAgentName: string;
  notes: string;
  budget: string;
  propertyInterest: string;
  createdAt: string;
  reminderDate: string | null;
  reminderText: string | null;
  source: 'Meta Ads' | 'Referral' | 'Website' | 'Outbound' | 'Walk-in';
  priority: 'hot' | 'warm' | 'cold';
  clientType: 'buyer' | 'seller';
  comments: ClientComment[];
  timeline: ClientEvent[];
}

export interface Task {
  id: string;
  description: string;
  assignedToId: string;
  assignedToName: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  completed: boolean;
  createdAt: string;
  clientId?: string;
  clientName?: string;
  category?: 'Client Call' | 'Site Viewing' | 'Contract Prep' | 'Brochure Delivery' | 'Other';
  status?: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  feedback?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'superadmin' | 'agent';
  text: string;
  timestamp: string;
  channel: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'introduction' | 'viewing' | 'followup' | 'pricing';
  text: string;
}

export interface ActivityLog {
  id: string;
  userName: string;
  action: string;
  timestamp: string;
}

export interface CampaignData {
  spend: number;
  impressions: number;
  leads: number;
  ctr: number;
  costPerLead: number;
}

const DEFAULT_USERS: User[] = [
  {
    id: '1',
    name: 'Prabal Luthra',
    email: 'prabal@alohaestates.com',
    role: 'superadmin',
    checkedIn: true,
    lastCheckIn: new Date(Date.now() - 3600000 * 4).toISOString(),
    lastCheckOut: null
  },
  {
    id: '2',
    name: 'Kabir Mehta',
    email: 'kabir@alohaestates.com',
    role: 'agent',
    checkedIn: true,
    lastCheckIn: new Date(Date.now() - 3600000 * 3).toISOString(),
    lastCheckOut: null
  },
  {
    id: '3',
    name: 'Ananya Sen',
    email: 'ananya@alohaestates.com',
    role: 'agent',
    checkedIn: false,
    lastCheckIn: new Date(Date.now() - 86400000).toISOString(),
    lastCheckOut: new Date(Date.now() - 86400000 + 28800000).toISOString()
  }
];

const DEFAULT_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Vikram Malhotra',
    email: 'vikram.m@gmail.com',
    phone: '+91 98100 12345',
    status: 'negotiation',
    assignedAgentId: '2',
    assignedAgentName: 'Kabir Mehta',
    notes: 'Interested in the DLF Camellias 4BHK apartment. Offered ₹35Cr, asking is ₹38Cr.',
    budget: '₹38 Cr',
    propertyInterest: 'DLF Camellias, Gurgaon',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    reminderDate: new Date(Date.now() + 3600000 * 2).toISOString(),
    reminderText: 'Follow up with seller regarding final negotiation discount',
    source: 'Referral',
    priority: 'hot',
    clientType: 'buyer',
    comments: [
      { text: 'Offered ₹35Cr. Seller wants ₹38Cr. Hard negotiation in progress.', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), author: 'Kabir Mehta' },
      { text: 'Prabal: Spoke with seller, he might settle for ₹36.5Cr. Kabir, pitch this tomorrow.', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), author: 'Prabal Luthra' }
    ],
    timeline: [
      { id: 'ev1', type: 'created', text: 'Client profile registered by Kabir Mehta', timestamp: new Date(Date.now() - 86400000 * 10).toISOString(), userName: 'Kabir Mehta' },
      { id: 'ev2', type: 'status_change', text: 'Status changed from LEAD to CONTACTED', timestamp: new Date(Date.now() - 86400000 * 8).toISOString(), userName: 'Kabir Mehta' },
      { id: 'ev3', type: 'status_change', text: 'Status changed from CONTACTED to VIEWING', timestamp: new Date(Date.now() - 86400000 * 7).toISOString(), userName: 'Kabir Mehta' },
      { id: 'ev4', type: 'status_change', text: 'Status changed from VIEWING to NEGOTIATION', timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), userName: 'Kabir Mehta' },
      { id: 'ev5', type: 'reminder_set', text: 'Reminder set: "Follow up with seller regarding final negotiation discount"', timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), userName: 'Kabir Mehta' }
    ]
  },
  {
    id: 'c2',
    name: 'Rohan Mehra',
    email: 'rohan.mehra@outlook.com',
    phone: '+91 99990 54321',
    status: 'viewing',
    assignedAgentId: '3',
    assignedAgentName: 'Ananya Sen',
    notes: 'Scheduled second site visit to the Alibaug beach villa with family.',
    budget: '₹14 Cr',
    propertyInterest: 'Beach Villa, Alibaug',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    reminderDate: new Date(Date.now() + 3600000 * 24).toISOString(),
    reminderText: 'Send video walkthrough of private pool area',
    source: 'Website',
    priority: 'warm',
    clientType: 'buyer',
    comments: [
      { text: 'Completed first viewing on Tuesday. Client loved the private beachfront. Family is positive.', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), author: 'Ananya Sen' }
    ],
    timeline: [
      { id: 'ev6', type: 'created', text: 'Client profile registered by Ananya Sen via website enquiry', timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), userName: 'Ananya Sen' },
      { id: 'ev7', type: 'status_change', text: 'Status changed from LEAD to VIEWING', timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), userName: 'Ananya Sen' },
      { id: 'ev8', type: 'reminder_set', text: 'Reminder set: "Send video walkthrough of private pool area"', timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), userName: 'Ananya Sen' }
    ]
  },
  {
    id: 'c3',
    name: 'Priya Sharma',
    email: 'priya_sharma@yahoo.com',
    phone: '+91 95600 67890',
    status: 'lead',
    assignedAgentId: '2',
    assignedAgentName: 'Kabir Mehta',
    notes: 'New lead from Instagram Ad Form. Interested in luxury penthouses in South Bombay.',
    budget: '₹22 Cr',
    propertyInterest: 'South Mumbai Penthouse',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    reminderDate: null,
    reminderText: null,
    source: 'Meta Ads',
    priority: 'warm',
    clientType: 'buyer',
    comments: [],
    timeline: [
      { id: 'ev9', type: 'created', text: 'Client lead synchronized via Meta Campaigns Webhook', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), userName: 'Meta Sync Bot' }
    ]
  },
  {
    id: 'c4',
    name: 'Aditya Birla Group (Corp)',
    email: 'corporate.re@adityabirla.com',
    phone: '+91 22 4567 8900',
    status: 'contacted',
    assignedAgentId: '1',
    assignedAgentName: 'Prabal Luthra',
    notes: 'Looking for a new premium corporate headquarters floor in BKC. Requirement: 50,000 sq ft.',
    budget: '₹150 Cr',
    propertyInterest: 'Commercial Space, BKC Mumbai',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    reminderDate: new Date(Date.now() + 3600000 * 48).toISOString(),
    reminderText: 'Call Aditya Birla Real Estate VP to align on commercial lease options',
    source: 'Outbound',
    priority: 'hot',
    clientType: 'buyer',
    comments: [
      { text: 'BKC commercial space verified. Exclusively pitching the top three floors. CFO is scheduled to join the call.', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), author: 'Prabal Luthra' }
    ],
    timeline: [
      { id: 'ev10', type: 'created', text: 'Corporate lead created by Prabal Luthra via cold outreach', timestamp: new Date(Date.now() - 86400000 * 15).toISOString(), userName: 'Prabal Luthra' },
      { id: 'ev11', type: 'status_change', text: 'Status changed from LEAD to CONTACTED', timestamp: new Date(Date.now() - 86400000 * 12).toISOString(), userName: 'Prabal Luthra' },
      { id: 'ev12', type: 'reminder_set', text: 'Reminder set: "Call Aditya Birla Real Estate VP"', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), userName: 'Prabal Luthra' }
    ]
  }
];

const DEFAULT_TASKS: Task[] = [
  {
    id: 't1',
    description: 'Prepare presentation deck for BKC Commercial Space',
    assignedToId: '2',
    assignedToName: 'Kabir Mehta',
    priority: 'high',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    completed: false,
    createdAt: new Date().toISOString(),
    clientId: 'c4',
    clientName: 'Aditya Birla Group (Corp)',
    category: 'Contract Prep',
    status: 'in_progress',
    feedback: ''
  },
  {
    id: 't2',
    description: 'Verify title deeds for Alibaug Beach Villa',
    assignedToId: '3',
    assignedToName: 'Ananya Sen',
    priority: 'medium',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    completed: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    clientId: 'c2',
    clientName: 'Rohan Mehra',
    category: 'Site Viewing',
    status: 'approved',
    feedback: 'Prabal: Excellent diligence on title verification.'
  },
  {
    id: 't3',
    description: 'Review Meta Ads campaign performance for Q3 launch',
    assignedToId: '1',
    assignedToName: 'Prabal Luthra',
    priority: 'high',
    dueDate: new Date(Date.now() + 3600000).toISOString().split('T')[0],
    completed: false,
    createdAt: new Date().toISOString(),
    category: 'Other',
    status: 'pending',
    feedback: ''
  }
];

const DEFAULT_CHAT: ChatMessage[] = [
  {
    id: 'm1',
    senderId: '2',
    senderName: 'Kabir Mehta',
    senderRole: 'agent',
    text: 'Good morning Prabal. Just checking in. I have scheduled a final negotiation meeting for Vikram Malhotra tomorrow.',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    channel: 'aloha-hq'
  },
  {
    id: 'm2',
    senderId: '1',
    senderName: 'Prabal Luthra',
    senderRole: 'superadmin',
    text: 'Great work Kabir. Make sure we check all documents before the meeting. Let me know if you need me to jump in.',
    timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString(),
    channel: 'aloha-hq'
  },
  {
    id: 'm3',
    senderId: '3',
    senderName: 'Ananya Sen',
    senderRole: 'agent',
    text: 'Site visit for Rohan Mehra in Alibaug is locked for Saturday morning. The estate keepers have been notified.',
    timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    channel: 'aloha-hq'
  },
  {
    id: 'm4',
    senderId: 'system',
    senderName: 'Meta Sync Bot',
    senderRole: 'superadmin',
    text: '⚡ New Meta Ad Lead captured: Priya Sharma is interested in South Mumbai Penthouse (₹20 - 25 Cr). Assigned to agent Kabir Mehta.',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    channel: 'marketing-leads'
  },
  {
    id: 'm5',
    senderId: 'system',
    senderName: 'Aloha System Bot',
    senderRole: 'superadmin',
    text: '🎉 Deal Closed! Kabir Mehta closed the transaction with Vikram Malhotra for DLF Camellias, Gurgaon (Budget: ₹35 - 40 Cr)!',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    channel: 'deals-vault'
  }
];

const DEFAULT_LOGS: ActivityLog[] = [
  {
    id: 'l1',
    userName: 'Kabir Mehta',
    action: 'Checked in for the day',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'l2',
    userName: 'Prabal Luthra',
    action: 'Assigned task "Verify title deeds" to Ananya Sen',
    timestamp: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'l3',
    userName: 'Ananya Sen',
    action: 'Completed task "Verify title deeds"',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
  }
];

const DEFAULT_CAMPAIGN: CampaignData = {
  spend: 4850,
  impressions: 218400,
  leads: 184,
  ctr: 3.4,
  costPerLead: 26.35
};

const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'wt1',
    name: 'Curated Brochure Intro',
    category: 'introduction',
    text: 'Hello {{clientName}}, this is {{agentName}} from Aloha Estates. It was a pleasure connecting with you. I am sharing our curated portfolio of ultra-luxury properties in {{interest}} that align with your budget of {{budget}}. Let me know if you would like me to send over the PDF brochure.'
  },
  {
    id: 'wt2',
    name: 'Schedule Site Viewing',
    category: 'viewing',
    text: 'Dear {{clientName}}, {{agentName}} here from Aloha Estates. We have scheduled private viewing access for {{interest}} this weekend. Would Saturday morning or Sunday afternoon work best for you and your family?'
  },
  {
    id: 'wt3',
    name: 'Negotiation Update',
    category: 'pricing',
    text: 'Hello {{clientName}}, I have reviewed the pricing feedback for the property at {{interest}} with founder Prabal Luthra. We have got an updated structure to share. Let me know when is a good time to connect for a quick 5-min call.'
  },
  {
    id: 'wt4',
    name: 'Daily Status Checkup',
    category: 'followup',
    text: 'Hi {{clientName}}, just following up to check if you had a chance to review the title deeds and layout documents I shared yesterday for {{interest}}. Let me know if you have any questions.'
  }
];

const STORAGE_KEYS = {
  USERS: 'aloha_crm_users',
  CLIENTS: 'aloha_crm_clients',
  TASKS: 'aloha_crm_tasks',
  CHAT: 'aloha_crm_chat',
  LOGS: 'aloha_crm_logs',
  CAMPAIGN: 'aloha_crm_campaign',
  PASSWORDS: 'aloha_crm_passwords'
};

export class CRMStore {
  static init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(DEFAULT_CLIENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(DEFAULT_TASKS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CHAT)) {
      localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(DEFAULT_CHAT));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(DEFAULT_LOGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CAMPAIGN)) {
      localStorage.setItem(STORAGE_KEYS.CAMPAIGN, JSON.stringify(DEFAULT_CAMPAIGN));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PASSWORDS)) {
      // Default passwords storage (Email -> Password mapping)
      const defaultPasswords: Record<string, string> = {
        'prabal@alohaestates.com': 'admin123',
        'kabir@alohaestates.com': 'agent123',
        'ananya@alohaestates.com': 'agent123'
      };
      localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(defaultPasswords));
    }
  }

  // --- Users Service ---
  static getUsers(): User[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  }

  static saveUsers(users: User[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    SupabaseSync.pushUsers(users);
  }

  static authenticate(email: string, pass: string): User | null {
    const users = this.getUsers();
    const passwords = JSON.parse(localStorage.getItem(STORAGE_KEYS.PASSWORDS) || '{}');
    
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user && passwords[user.email.toLowerCase()] === pass) {
      return user;
    }
    return null;
  }

  static addTeamMember(name: string, email: string, pass: string): { success: boolean; error?: string } {
    const users = this.getUsers();
    const emailLower = email.toLowerCase();
    
    if (users.some(u => u.email.toLowerCase() === emailLower)) {
      return { success: false, error: 'Email already exists' };
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email: emailLower,
      role: 'agent',
      checkedIn: false,
      lastCheckIn: null,
      lastCheckOut: null
    };

    users.push(newUser);
    this.saveUsers(users);

    const passwords = JSON.parse(localStorage.getItem(STORAGE_KEYS.PASSWORDS) || '{}');
    passwords[emailLower] = pass;
    localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(passwords));

    this.addLog('Superadmin', `Added new team member: ${name} (${email})`);

    return { success: true };
  }

  static deleteTeamMember(userId: string): boolean {
    let users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return false;
    
    if (user.role === 'superadmin') return false;

    users = users.filter(u => u.id !== userId);
    this.saveUsers(users);

    const passwords = JSON.parse(localStorage.getItem(STORAGE_KEYS.PASSWORDS) || '{}');
    delete passwords[user.email.toLowerCase()];
    localStorage.setItem(STORAGE_KEYS.PASSWORDS, JSON.stringify(passwords));

    this.addLog('Superadmin', `De-provisioned team member: ${user.name}`);
    return true;
  }

  static toggleCheckIn(userId: string): User | null {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return null;

    const user = users[userIndex];
    user.checkedIn = !user.checkedIn;
    const now = new Date().toISOString();
    
    if (user.checkedIn) {
      user.lastCheckIn = now;
      this.addLog(user.name, 'Checked in for shift');
    } else {
      user.lastCheckOut = now;
      this.addLog(user.name, 'Checked out of shift');
    }

    users[userIndex] = user;
    this.saveUsers(users);
    return user;
  }

  // --- Clients Service ---
  static getClients(): Client[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]');
  }

  static saveClients(clients: Client[]) {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    SupabaseSync.pushClients(clients);
  }

  static addClient(client: Omit<Client, 'id' | 'createdAt'>, actorName?: string): Client {
    const clients = this.getClients();
    const newClient: Client = {
      ...client,
      id: 'c_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      comments: client.comments || [],
      timeline: client.timeline || [
        {
          id: 'ev_' + Math.random().toString(36).substr(2, 9),
          type: 'created',
          text: `Client profile registered. Source: ${client.source || 'Direct'}. Assigned agent: ${client.assignedAgentName}.`,
          timestamp: new Date().toISOString(),
          userName: client.assignedAgentName || 'CRM System'
        }
      ]
    };
    clients.unshift(newClient);
    this.saveClients(clients);
    this.addLog(actorName || 'CRM System', `New client profile created: ${newClient.name}`);
    return newClient;
  }

  static updateClient(clientId: string, updates: Partial<Client>, actorName?: string): Client | null {
    const clients = this.getClients();
    const idx = clients.findIndex(c => c.id === clientId);
    if (idx === -1) return null;

    const client = clients[idx];
    const oldName = client.name;
    
    // Check if agent assignment is changing to log and sync name
    if (updates.assignedAgentId && updates.assignedAgentId !== client.assignedAgentId) {
      const agent = this.getUsers().find(u => u.id === updates.assignedAgentId);
      if (agent) {
        updates.assignedAgentName = agent.name;
      }
    }

    // Merge changes
    const updatedClient = {
      ...client,
      ...updates
    };

    clients[idx] = updatedClient;
    this.saveClients(clients);

    // Timeline event
    const changesList: string[] = [];
    Object.keys(updates).forEach(key => {
      if (key !== 'timeline' && key !== 'comments' && key !== 'assignedAgentName') {
        changesList.push(`${key} changed to "${(updates as any)[key]}"`);
      }
    });

    if (changesList.length > 0) {
      const newEvent = {
        id: 'ev_' + Math.random().toString(36).substr(2, 9),
        type: 'status_change' as const,
        text: `Client details edited: ${changesList.join(', ')}`,
        timestamp: new Date().toISOString(),
        userName: 'CRM System'
      };
      updatedClient.timeline = updatedClient.timeline || [];
      updatedClient.timeline.unshift(newEvent);
      
      // Save client again with timeline
      clients[idx] = updatedClient;
      this.saveClients(clients);
    }

    this.addLog(actorName || 'CRM System', `Updated details for client ${oldName}`);
    return updatedClient;
  }

  static updateClientStatus(clientId: string, status: Client['status'], actorName?: string): Client | null {
    const clients = this.getClients();
    const clientIndex = clients.findIndex(c => c.id === clientId);
    if (clientIndex === -1) return null;

    const client = clients[clientIndex];
    const oldStatus = client.status;
    client.status = status;
    
    // Add event log to timeline
    const eventText = `Status updated from ${oldStatus.toUpperCase()} to ${status.toUpperCase()}`;
    const newEvent = {
      id: 'ev_' + Math.random().toString(36).substr(2, 9),
      type: 'status_change' as const,
      text: eventText,
      timestamp: new Date().toISOString(),
      userName: client.assignedAgentName || 'CRM System'
    };
    client.timeline = client.timeline || [];
    client.timeline.unshift(newEvent);

    this.saveClients(clients);
    this.addLog(actorName || 'CRM System', `Updated client ${client.name} status to ${status.toUpperCase()}`);

    if (status === 'closed' && oldStatus !== 'closed') {
      this.sendMessage(
        'system',
        `🎉 Deal Closed! ${client.assignedAgentName} closed a transaction with ${client.name} for ${client.propertyInterest} (Volume: ${client.budget})!`,
        'deals-vault'
      );
    }
    return client;
  }

  static setClientReminder(clientId: string, date: string | null, text: string | null, actorName?: string): Client | null {
    const clients = this.getClients();
    const clientIndex = clients.findIndex(c => c.id === clientId);
    if (clientIndex === -1) return null;

    const client = clients[clientIndex];
    client.reminderDate = date;
    client.reminderText = text;
    
    client.timeline = client.timeline || [];
    if (date && text) {
      const newEvent = {
        id: 'ev_' + Math.random().toString(36).substr(2, 9),
        type: 'reminder_set' as const,
        text: `Reminder set for follow-up: "${text}"`,
        timestamp: new Date().toISOString(),
        userName: client.assignedAgentName || 'CRM System'
      };
      client.timeline.unshift(newEvent);
      this.addLog(actorName || 'CRM System', `Reminder set for client ${client.name} on ${new Date(date).toLocaleDateString()}`);
    } else {
      const newEvent = {
        id: 'ev_' + Math.random().toString(36).substr(2, 9),
        type: 'reminder_set' as const,
        text: `Reminder cleared`,
        timestamp: new Date().toISOString(),
        userName: client.assignedAgentName || 'CRM System'
      };
      client.timeline.unshift(newEvent);
    }
    
    this.saveClients(clients);
    return client;
  }

  static addClientComment(clientId: string, text: string, author: string): Client | null {
    const clients = this.getClients();
    const clientIndex = clients.findIndex(c => c.id === clientId);
    if (clientIndex === -1) return null;

    const client = clients[clientIndex];
    client.comments = client.comments || [];
    client.comments.push({
      text,
      timestamp: new Date().toISOString(),
      author
    });

    const newEvent = {
      id: 'ev_' + Math.random().toString(36).substr(2, 9),
      type: 'note_added' as const,
      text: `Note added: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`,
      timestamp: new Date().toISOString(),
      userName: author
    };
    client.timeline = client.timeline || [];
    client.timeline.unshift(newEvent);

    this.saveClients(clients);
    this.addLog(author, `Added viewing notes comment on client ${client.name} dossier: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
    return client;
  }

  static deleteClient(clientId: string, actorName?: string): boolean {
    let clients = this.getClients();
    const client = clients.find(c => c.id === clientId);
    if (!client) return false;
    
    clients = clients.filter(c => c.id !== clientId);
    this.saveClients(clients);
    this.addLog(actorName || 'CRM System', `Deleted client record: ${client.name}`);
    return true;
  }

  // --- Tasks Service ---
  static getTasks(): Task[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
  }

  static saveTasks(tasks: Task[]) {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    SupabaseSync.pushTasks(tasks);
  }

  static addTask(
    description: string, 
    assignedToId: string, 
    priority: Task['priority'], 
    dueDate: string,
    clientId?: string,
    category?: Task['category'],
    actorName?: string
  ): Task {
    const tasks = this.getTasks();
    const users = this.getUsers();
    const assignedUser = users.find(u => u.id === assignedToId);
    
    let clientName = undefined;
    if (clientId) {
      const client = this.getClients().find(c => c.id === clientId);
      if (client) {
        clientName = client.name;
        
        // Log to client timeline that a task was assigned
        const newEvent = {
          id: 'ev_' + Math.random().toString(36).substr(2, 9),
          type: 'status_change' as const,
          text: `Task assigned to ${assignedUser ? assignedUser.name : 'agent'}: "${description}"`,
          timestamp: new Date().toISOString(),
          userName: 'Prabal Luthra (Founder)'
        };
        client.timeline = client.timeline || [];
        client.timeline.unshift(newEvent);
        this.saveClients(this.getClients().map(c => c.id === clientId ? client : c));
      }
    }

    const newTask: Task = {
      id: 't_' + Math.random().toString(36).substr(2, 9),
      description,
      assignedToId,
      assignedToName: assignedUser ? assignedUser.name : 'Unassigned',
      priority,
      dueDate,
      completed: false,
      createdAt: new Date().toISOString(),
      clientId,
      clientName,
      category: category || 'Other',
      status: 'pending',
      feedback: ''
    };

    tasks.unshift(newTask);
    this.saveTasks(tasks);
    this.addLog(actorName || 'Superadmin', `Assigned task "${description}" to ${newTask.assignedToName}`);
    return newTask;
  }

  static toggleTaskCompleted(taskId: string, actorName?: string): Task | null {
    const tasks = this.getTasks();
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return null;

    const task = tasks[idx];
    task.completed = !task.completed;
    task.status = task.completed ? 'completed' : 'in_progress';
    
    // Log to client timeline if linked
    if (task.clientId) {
      const client = this.getClients().find(c => c.id === task.clientId);
      if (client) {
        const newEvent = {
          id: 'ev_' + Math.random().toString(36).substr(2, 9),
          type: 'status_change' as const,
          text: `Task "${task.description}" marked as ${task.completed ? 'COMPLETED' : 'INCOMPLETE'}`,
          timestamp: new Date().toISOString(),
          userName: task.assignedToName
        };
        client.timeline = client.timeline || [];
        client.timeline.unshift(newEvent);
        this.saveClients(this.getClients().map(c => c.id === task.clientId ? client : c));
      }
    }

    this.saveTasks(tasks);
    this.addLog(actorName || 'CRM System', `Task "${task.description}" marked as ${task.completed ? 'COMPLETED' : 'INCOMPLETE'}`);
    return task;
  }

  static updateTaskStatus(taskId: string, status: Task['status'], feedback?: string, actorName?: string): Task | null {
    const tasks = this.getTasks();
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return null;

    const task = tasks[idx];
    task.status = status;
    if (status === 'completed' || status === 'approved') {
      task.completed = true;
    } else {
      task.completed = false;
    }
    
    if (feedback !== undefined) {
      task.feedback = feedback;
    }

    // Log to client timeline if linked
    if (task.clientId) {
      const client = this.getClients().find(c => c.id === task.clientId);
      if (client) {
        const newEvent = {
          id: 'ev_' + Math.random().toString(36).substr(2, 9),
          type: 'status_change' as const,
          text: `Task status updated to ${status!.toUpperCase()}${feedback ? `. Feedback: "${feedback}"` : ''}`,
          timestamp: new Date().toISOString(),
          userName: 'Prabal Luthra (Founder)'
        };
        client.timeline = client.timeline || [];
        client.timeline.unshift(newEvent);
        this.saveClients(this.getClients().map(c => c.id === task.clientId ? client : c));
      }
    }

    this.saveTasks(tasks);
    this.addLog(actorName || 'CRM System', `Updated task "${task.description}" status to ${status!.toUpperCase()}`);
    return task;
  }

  static deleteTask(taskId: string): boolean {
    let tasks = this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return false;

    tasks = tasks.filter(t => t.id !== taskId);
    this.saveTasks(tasks);
    return true;
  }

  // --- Chat Service ---
  static getMessages(): ChatMessage[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CHAT) || '[]');
  }

  static saveMessages(messages: ChatMessage[]) {
    localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(messages));
    SupabaseSync.pushMessages(messages);
  }

  static sendMessage(senderId: string, text: string, channel: string = 'aloha-hq'): ChatMessage {
    const messages = this.getMessages();
    const users = this.getUsers();
    const sender = users.find(u => u.id === senderId);
    
    const newMsg: ChatMessage = {
      id: 'm_' + Math.random().toString(36).substr(2, 9),
      senderId,
      senderName: sender ? sender.name : (senderId === 'system' ? 'Aloha Bot' : 'Unknown User'),
      senderRole: sender ? sender.role : 'superadmin',
      text,
      timestamp: new Date().toISOString(),
      channel
    };

    messages.push(newMsg);
    this.saveMessages(messages);
    return newMsg;
  }

  // --- Activity Logs ---
  static getLogs(): ActivityLog[] {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
  }

  static addLog(userName: string, action: string) {
    const logs = this.getLogs();
    const newLog: ActivityLog = {
      id: 'l_' + Math.random().toString(36).substr(2, 9),
      userName,
      action,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    if (logs.length > 100) logs.pop();
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    SupabaseSync.pushLogs(logs);
  }

  // --- Campaign Control ---
  static getCampaignData(): CampaignData {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CAMPAIGN) || JSON.stringify(DEFAULT_CAMPAIGN));
  }

  static saveCampaignData(data: CampaignData) {
    localStorage.setItem(STORAGE_KEYS.CAMPAIGN, JSON.stringify(data));
  }

  // --- Meta Integration Simulation ---
  static simulateMetaLead(): Client {
    const names = ['Meera Nair', 'Amit Goel', 'Sameer Verma', 'Karan Johar', 'Neha Dhupia', 'Dev Patel'];
    const properties = ['Premium Villa, Goa', 'Lodha Bellissimo, Mumbai', 'Golf Course Penthouse, Noida', 'Heritage Bungalow, Jaipur'];
    const budgets = ['₹8 - 10 Cr', '₹22 Cr', '₹15 Cr', '₹35 Cr'];
    const phones = ['+91 98765 43210', '+91 99887 76655', '+91 97654 32109', '+91 88776 65544'];
    
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomProp = properties[Math.floor(Math.random() * properties.length)];
    const randomBudget = budgets[Math.floor(Math.random() * budgets.length)];
    const randomPhone = phones[Math.floor(Math.random() * phones.length)];
    const randomEmail = `${randomName.toLowerCase().replace(' ', '.')}@gmail.com`;

    const agents = this.getUsers().filter(u => u.role === 'agent');
    const randomAgent = agents[Math.floor(Math.random() * agents.length)] || { id: '1', name: 'Prabal Luthra' };

    // Update campaign metrics
    const camp = this.getCampaignData();
    camp.leads += 1;
    camp.impressions += Math.floor(Math.random() * 200) + 100;
    camp.costPerLead = Number((camp.spend / camp.leads).toFixed(2));
    this.saveCampaignData(camp);

    const newLead = this.addClient({
      name: randomName,
      email: randomEmail,
      phone: randomPhone,
      status: 'lead',
      assignedAgentId: randomAgent.id,
      assignedAgentName: randomAgent.name,
      notes: `Synchronized via Meta Leads Ad Form "Aloha Q3 Luxury Campaigns". Property interest: ${randomProp}`,
      budget: randomBudget,
      propertyInterest: randomProp,
      reminderDate: null,
      reminderText: null,
      source: 'Meta Ads',
      priority: 'warm',
      clientType: 'buyer',
      comments: [],
      timeline: []
    });

    this.sendMessage(
      'system',
      `⚡ New Meta Ad Lead captured: ${newLead.name} is interested in ${newLead.propertyInterest} (${newLead.budget}). Assigned to agent ${newLead.assignedAgentName}.`,
      'marketing-leads'
    );

    return newLead;
  }

  static getWhatsAppTemplates(): WhatsAppTemplate[] {
    return DEFAULT_WHATSAPP_TEMPLATES;
  }
}
