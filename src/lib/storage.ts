import { Lead, LeadCategory, LeadStatus, PipelineStats } from './types';
import { INITIAL_SEEDS } from './seed-data';

const STORAGE_KEY = 'vietqr_lead_hunter_leads_real_v1';
const API_KEY_STORAGE = 'vietqr_gmaps_api_key';

export function getStoredLeads(): Lead[] {
  if (typeof window === 'undefined') {
    return INITIAL_SEEDS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read from localStorage:', err);
    return [];
  }
}

export function saveLeads(leads: Lead[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function addLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Lead {
  const leads = getStoredLeads();
  const newLead: Lead = {
    ...lead,
    id: 'lead-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const updated = [newLead, ...leads];
  saveLeads(updated);
  return newLead;
}

export function addMultipleLeads(newLeads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[]): Lead[] {
  const currentLeads = getStoredLeads();
  const createdList: Lead[] = newLeads.map((item, idx) => ({
    ...item,
    id: 'lead-' + Date.now() + '-' + idx,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  const updated = [...createdList, ...currentLeads];
  saveLeads(updated);
  return updated;
}

export function updateLeadStatus(id: string, status: LeadStatus): Lead[] {
  const leads = getStoredLeads();
  const updated = leads.map((item) =>
    item.id === id ? { ...item, status, updatedAt: new Date().toISOString() } : item
  );
  saveLeads(updated);
  return updated;
}

export function deleteLead(id: string): Lead[] {
  const leads = getStoredLeads();
  const updated = leads.filter((item) => item.id !== id);
  saveLeads(updated);
  return updated;
}

export function clearAllLeads(): void {
  saveLeads([]);
}

export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(API_KEY_STORAGE) || '';
}

export function saveStoredApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(API_KEY_STORAGE, key.trim());
}

export function computePipelineStats(leads: Lead[]): PipelineStats {
  const total = leads.length;
  const newLeads = leads.filter((l) => l.status === 'new').length;
  const contacted = leads.filter((l) => l.status === 'contacted').length;
  const viewedDemo = leads.filter((l) => l.status === 'viewed_demo').length;
  const negotiating = leads.filter((l) => l.status === 'negotiating').length;
  const won = leads.filter((l) => l.status === 'won').length;
  const lost = leads.filter((l) => l.status === 'lost').length;
  const conversionRate = total > 0 ? Math.round((won / total) * 100) : 0;

  return {
    total,
    newLeads,
    contacted,
    viewedDemo,
    negotiating,
    won,
    lost,
    conversionRate,
  };
}
