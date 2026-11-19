export type LeadCategory = 'spa' | 'dental' | 'salon' | 'sports' | 'clinic' | 'restaurant' | 'hotel' | 'other';

export type LeadStatus = 'new' | 'contacted' | 'viewed_demo' | 'negotiating' | 'won' | 'lost';

export interface Lead {
  id: string;
  name: string;
  category: LeadCategory;
  phone: string;
  phoneType?: 'mobile' | 'landline' | 'none';
  location: string;
  managerName?: string;
  status: LeadStatus;
  demoSlug: string;
  demoUrl?: string;
  isDemoCreated?: boolean;
  googleMapsUrl?: string;
  rating?: number;
  reviewCount?: number;
  website?: string | null;
  hasWebsite?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GooglePlaceResult {
  placeId: string;
  name: string;
  address: string;
  phone?: string;
  rating?: number;
  reviewCount?: number;
  googleMapsUri?: string;
  types?: string[];
  category: LeadCategory;
}

export interface OutreachScript {
  id: string;
  category: LeadCategory;
  title: string;
  template: string;
}

export interface PipelineStats {
  total: number;
  newLeads: number;
  contacted: number;
  viewedDemo: number;
  negotiating: number;
  won: number;
  lost: number;
  conversionRate: number;
}
