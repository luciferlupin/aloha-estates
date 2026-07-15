import { supabase } from './supabaseClient';

const STORAGE_KEYS = {
  USERS: 'aloha_crm_users',
  CLIENTS: 'aloha_crm_clients',
  TASKS: 'aloha_crm_tasks',
  CHAT: 'aloha_crm_chat_messages',
  LOGS: 'aloha_crm_activity_logs',
  CAMPAIGN: 'aloha_crm_campaign_data'
};

export class SupabaseSync {
  static isSyncing = false;
  static realtimeChannel: any = null;

  // Sync down all tables from Supabase into LocalStorage cache
  static async syncDown() {
    if (this.isSyncing) return;
    this.isSyncing = true;
    try {
      // 1. Fetch Users
      const { data: dbUsers, error: userErr } = await supabase.from('users').select('*');
      if (userErr) throw userErr;
      
      if (dbUsers && dbUsers.length > 0) {
        const users = dbUsers.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          checkedIn: u.checked_in,
          lastCheckIn: u.last_check_in,
          lastCheckOut: u.last_check_out
        }));
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }

      // 2. Fetch Clients & sub-collections
      const { data: dbClients } = await supabase.from('clients').select('*');
      const { data: dbComments } = await supabase.from('client_comments').select('*');
      const { data: dbTimeline } = await supabase.from('client_timeline').select('*');

      if (dbClients) {
        const clients = dbClients.map(c => {
          const clientComments = (dbComments || [])
            .filter(comm => comm.client_id === c.id)
            .map(comm => ({
              text: comm.text,
              timestamp: comm.created_at,
              author: comm.author_name
            }));

          const clientTimeline = (dbTimeline || [])
            .filter(t => t.client_id === c.id)
            .map(t => ({
              id: t.id,
              type: t.type,
              text: t.text,
              timestamp: t.created_at,
              userName: t.user_name
            }));

          return {
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            status: c.status,
            assignedAgentId: c.assigned_agent_id,
            assignedAgentName: dbUsers?.find(u => u.id === c.assigned_agent_id)?.name || 'Unassigned',
            budget: c.budget,
            propertyInterest: c.property_interest,
            source: c.source,
            priority: c.priority,
            clientType: c.client_type,
            reminderDate: c.reminder_date,
            reminderText: c.reminder_text,
            comments: clientComments,
            timeline: clientTimeline,
            createdAt: c.created_at
          };
        });
        localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
      }

      // 3. Fetch Tasks
      const { data: dbTasks } = await supabase.from('tasks').select('*');
      if (dbTasks) {
        const tasks = dbTasks.map(t => ({
          id: t.id,
          description: t.description,
          assignedToId: t.assigned_to_id,
          assignedToName: dbUsers?.find(u => u.id === t.assigned_to_id)?.name || 'Unassigned',
          priority: t.priority,
          dueDate: t.due_date,
          completed: t.completed,
          clientId: t.client_id,
          clientName: dbClients?.find(c => c.id === t.client_id)?.name,
          category: t.category,
          status: t.status,
          feedback: t.feedback,
          createdAt: t.created_at
        }));
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      }

      // 4. Fetch Messages
      const { data: dbMessages } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (dbMessages) {
        const messages = dbMessages.map(m => ({
          id: m.id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          senderRole: m.sender_role,
          text: m.text,
          timestamp: m.created_at,
          channel: m.channel
        }));
        localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(messages));
      }

      // 5. Fetch Logs
      const { data: dbLogs } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false });
      if (dbLogs) {
        const logs = dbLogs.map(l => ({
          id: l.id,
          userName: l.user_name,
          action: l.action,
          timestamp: l.created_at
        }));
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
      }

      // Notify App Components to update states
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.warn('Supabase sync-down failed. Falling back to local offline storage cache:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  // Real-time synchronization listeners
  static subscribeRealtime() {
    try {
      const activeChannel = supabase.channel('schema-db-changes');
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    } catch (e) {
      // ignore
    }

    this.realtimeChannel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        this.syncDown();
      });
    this.realtimeChannel.subscribe();
  }

  // Push local changes to Supabase
  static async pushUsers(users: any[]) {
    try {
      const rows = users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        checked_in: u.checkedIn,
        last_check_in: u.lastCheckIn,
        last_check_out: u.lastCheckOut
      }));
      await supabase.from('users').upsert(rows);
    } catch (e) {
      console.warn('Supabase push users failed:', e);
    }
  }

  static async pushClients(clients: any[]) {
    try {
      const clientRows = clients.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        status: c.status,
        assigned_agent_id: c.assignedAgentId || null,
        budget: c.budget,
        property_interest: c.propertyInterest,
        source: c.source,
        priority: c.priority,
        client_type: c.clientType,
        reminder_date: c.reminderDate,
        reminder_text: c.reminderText
      }));
      await supabase.from('clients').upsert(clientRows);

      // Comments & Timeline Upserts
      const commentRows: any[] = [];
      const timelineRows: any[] = [];

      clients.forEach(c => {
        if (c.comments) {
          c.comments.forEach((comm: any) => {
            commentRows.push({
              client_id: c.id,
              author_name: comm.author,
              text: comm.text,
              created_at: comm.timestamp
            });
          });
        }
        if (c.timeline) {
          c.timeline.forEach((t: any) => {
            timelineRows.push({
              id: t.id.startsWith('ev_') && t.id.length < 30 ? undefined : t.id,
              client_id: c.id,
              type: t.type,
              text: t.text,
              user_name: t.userName,
              created_at: t.timestamp
            });
          });
        }
      });

      if (commentRows.length > 0) {
        await supabase.from('client_comments').upsert(commentRows);
      }
      if (timelineRows.length > 0) {
        await supabase.from('client_timeline').upsert(timelineRows);
      }
    } catch (e) {
      console.warn('Supabase push clients failed:', e);
    }
  }

  static async pushTasks(tasks: any[]) {
    try {
      const rows = tasks.map(t => ({
        id: t.id,
        description: t.description,
        assigned_to_id: t.assignedToId,
        priority: t.priority,
        due_date: t.dueDate,
        completed: t.completed,
        client_id: t.clientId || null,
        category: t.category || 'Other',
        status: t.status || 'pending',
        feedback: t.feedback || ''
      }));
      await supabase.from('tasks').upsert(rows);
    } catch (e) {
      console.warn('Supabase push tasks failed:', e);
    }
  }

  static async pushMessages(messages: any[]) {
    try {
      const rows = messages.map(m => ({
        id: m.id,
        sender_id: m.senderId === 'system' ? null : m.senderId,
        sender_name: m.senderName,
        sender_role: m.senderRole,
        text: m.text,
        channel: m.channel,
        created_at: m.timestamp
      }));
      await supabase.from('messages').upsert(rows);
    } catch (e) {
      console.warn('Supabase push messages failed:', e);
    }
  }

  static async pushLogs(logs: any[]) {
    try {
      const rows = logs.map(l => ({
        id: l.id,
        user_name: l.userName,
        action: l.action,
        created_at: l.timestamp
      }));
      await supabase.from('activity_logs').upsert(rows);
    } catch (e) {
      console.warn('Supabase push activity logs failed:', e);
    }
  }
}
