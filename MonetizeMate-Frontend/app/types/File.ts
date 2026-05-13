export interface BackendFile {
    id: number;
    audience_id: number;
    filename: string;
    displayname?: string;
    file_size: number;
    file_type: string;
    upload_time: Date;
    description?: string;
    records?: number;
    decisionMetrics: string
}