
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Category, ChecklistItem, Task } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Schema for parsing messy text/audio into structured tasks
const taskParseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Short title (e.g., 'Renew Ejari')" },
          description: { type: Type.STRING, description: "Brief details extracted from text" },
          dueDate: { type: Type.STRING, description: "ISO 8601 date (YYYY-MM-DD)." },
          dueTime: { type: Type.STRING, description: "24-hour format time (HH:mm)." },
          category: { 
            type: Type.STRING, 
            enum: ['Work & Career', 'Personal & Health', 'Home & Family', 'Finance & Bills', 'Other']
          },
          priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
          recurrence: { 
            type: Type.STRING, 
            enum: ['none', 'daily', 'weekly', 'monthly', 'yearly']
          }
        },
        required: ['title', 'category', 'dueDate', 'priority']
      }
    }
  },
  required: ['tasks']
};

const checklistSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['document', 'action'] }
        },
        required: ['text', 'type']
      }
    }
  },
  required: ['items']
};

export const parseMessyInput = async (inputText: string): Promise<any[]> => {
  try {
    const model = 'gemini-3-flash-preview';
    const localDate = getLocalDateString();
    
    const response = await ai.models.generateContent({
      model,
      contents: `Current Date: ${localDate}. Analyze this text and extract UAE Life Admin tasks: "${inputText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: taskParseSchema,
        systemInstruction: "You are a UAE Life Admin assistant. Help users track Ejari, DEWA, Visa renewals, and Emirates ID dates.",
      }
    });

    const result = JSON.parse(response.text || '{"tasks": []}');
    return result.tasks;
  } catch (error) {
    console.error("Error parsing input:", error);
    throw error;
  }
};

export const parseAudioInput = async (base64Audio: string, mimeType: string): Promise<any[]> => {
  try {
    const model = 'gemini-3-flash-preview'; // Multimodal support
    const localDate = getLocalDateString();
    
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Audio } },
          { text: `Current Date: ${localDate}. Listen to this audio and extract tasks into the specified JSON format.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: taskParseSchema,
      }
    });

    const result = JSON.parse(response.text || '{"tasks": []}');
    return result.tasks;
  } catch (error) {
    console.error("Error parsing audio:", error);
    throw error;
  }
};

export const generateChecklistForTask = async (taskTitle: string, category: string): Promise<ChecklistItem[]> => {
  try {
    const model = 'gemini-3-flash-preview';
    const response = await ai.models.generateContent({
      model,
      contents: `Generate a checklist (max 5 items) for: "${taskTitle}" in category "${category}". If it's too simple, return empty.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: checklistSchema,
      }
    });

    const result = JSON.parse(response.text || '{"items": []}');
    return result.items.map((item: any) => ({
      id: crypto.randomUUID(),
      text: item.text,
      type: item.type,
      isCompleted: false
    }));
  } catch (error) {
    return [];
  }
};

export const askAboutTasks = async (query: string, tasks: Task[]): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview';
    const tasksContext = tasks.map(t => ({
      title: t.title,
      dueDate: t.dueDate,
      status: t.status
    }));

    const response = await ai.models.generateContent({
      model,
      contents: `Query: "${query}". Context: ${JSON.stringify(tasksContext)}. Answer briefly.`,
      config: {
        systemInstruction: "You are a helpful life admin assistant. Answer questions about the user's schedule.",
      }
    });

    return response.text || "I couldn't find that information.";
  } catch (error) {
    return "Error connecting to AI assistant.";
  }
};
