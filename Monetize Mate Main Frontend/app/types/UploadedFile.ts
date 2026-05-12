export interface UploadedFile {
  id: string;
  name : string;
  displayName?: string;
  size: number;
  type: string;
  uploadDate: Date;
  data?: any[];
  description?: string;
  records?: number;
}