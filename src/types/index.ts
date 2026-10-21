export interface AdminUser {
  id: string;
  username: string;
  email: string;
  password?: string;
  name: string;
  role: 'superadmin' | 'admin';
  createdAt: string;
}

export interface StudioPhoto {
  id: string;
  folderId: string;
  url: string;
  title: string;
  orientation?: 'portrait' | 'landscape' | 'square';
  uploadDate: string;
}

export interface ClientSelection {
  selected: boolean;
  note?: string;
  selectedAt: string;
}

export interface ClientFolder {
  id: string;
  slug: string;
  name: string;
  clientName: string;
  clientEmail?: string;
  clientPassword: string; // Folder-specific password for the client
  category: string;
  eventDate: string;
  targetSelectionCount?: number;
  notes?: string;
  watermarkText?: string;
  photos: StudioPhoto[];
  selections: Record<string, ClientSelection>; // photoId -> selection
  selectionSubmitted?: boolean;
  submittedAt?: string;
  clientSubmissionNote?: string;
  createdAt: string;
}

export interface PricingPackage {
  id: string;
  name: string;
  price: string;
  tagline: string;
  popular?: boolean;
  duration: string;
  deliverables: string[];
  features: string[];
}

export interface PortfolioEventImage {
  id: string;
  url: string;
  caption?: string;
  orientation?: 'portrait' | 'landscape' | 'square';
}

export interface PortfolioShowcase {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  client?: string;
  year?: string;
  description?: string;
  location?: string;
  eventDate?: string;
  images: PortfolioEventImage[];
}
