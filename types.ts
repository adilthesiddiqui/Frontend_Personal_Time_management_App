export enum Category {
  WORK = 'Work & Career',
  PERSONAL = 'Personal & Health',
  HOME = 'Home & Family',
  FINANCE = 'Finance & Bills',
  OTHER = 'Other'
}

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface AttachedDocument {
  id: string;
  name: string;
  type: string;
  dataUrl: string; // Base64
}

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
  type: 'document' | 'action'; // Is this a doc needed or an action to take?
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // ISO Date string YYYY-MM-DD
  dueTime?: string; // HH:mm 24h format
  category: Category;
  checklist: ChecklistItem[];
  status: 'pending' | 'completed' | 'overdue';
  priority: 'high' | 'medium' | 'low';
  recurrence?: Recurrence;
  documents?: AttachedDocument[];
}

export interface AIParseResult {
  tasks: Array<{
    title: string;
    description: string;
    dueDate: string;
    dueTime?: string;
    category: string;
    priority: string;
    recurrence?: string;
  }>;
}