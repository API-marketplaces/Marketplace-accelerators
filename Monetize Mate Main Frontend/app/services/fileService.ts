import { BackendFile } from '@/app/types/File';
import { apiFetch } from '../lib/fetcher';

export const getFilesByDecisionMetrics = async (decisionMetrics: string): Promise<BackendFile[]> => {
  try {
    return await apiFetch<BackendFile[]>(`/api/file/fetchfiles?decisionMetrics=${decisionMetrics}`);
  } catch (error) {
    console.error("Error fetching files:", error);
    throw error;
  }
};

export const uploadFileToBackend = async (
  file: File,
  displayName: string,
  description: string,
  decisionMetrics: string
): Promise<BackendFile> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('displayname', displayName);
  formData.append('description', description);
  formData.append('decisionMetrics', decisionMetrics);

  const res = await fetch('/api/uploads/mark', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(err.detail || err.message || 'Upload failed');
  }

  return res.json();
};