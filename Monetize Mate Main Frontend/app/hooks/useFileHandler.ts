"use client"

import { useState, useEffect, useCallback } from 'react';
import { UploadedFile } from '../types/UploadedFile';
import { getFilesByDecisionMetrics, uploadFileToBackend } from '../services/fileService';

export const useFileHandler = (decisionMetrics?: string) => {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (decisionMetrics) {
            setIsLoading(true);
            getFilesByDecisionMetrics(decisionMetrics)
                .then(files => {
                    setUploadedFiles(files.map(file => ({
                        id: file.id.toString(),
                        name: file.filename,
                        displayName: file.displayname,
                        size: file.file_size,
                        type: file.file_type,
                        uploadDate: file.upload_time,
                        description: file.description || "",
                        records: file.records || 0,
                    })) as UploadedFile[]);
                    setIsLoading(false);
                })
                .catch(err => {
                    setError('Failed to load files.');
                    setIsLoading(false);
                });
        }
    }, [decisionMetrics]);

    const handleFileUpload = async (file: File, displayName?: string, description?: string): Promise<UploadedFile | null> => {
        try {
            // Upload to backend and get real integer ID back
            const backendFile = await uploadFileToBackend(
                file,
                displayName || file.name,
                description || "",
                decisionMetrics || "analytics"
            );

            const newFile: UploadedFile = {
                id: backendFile.id.toString(), // real backend integer ID
                name: backendFile.filename,
                displayName: backendFile.displayname,
                size: backendFile.file_size,
                type: backendFile.file_type,
                uploadDate: backendFile.upload_time,
                description: backendFile.description || "",
                records: backendFile.records || 0,
            };

            setUploadedFiles(prev => [...prev, newFile]);
            return newFile;
        } catch (error) {
            console.error("Error handling file upload:", error);
            return null;
        }
    };

    const handleFileDelete = (fileId: string) => {
        setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const handleFileDownload = (fileId: string) => {
        console.log(`Download requested for ${fileId}`);
    };

    const handleFileUpdate = (fileId: string, updates: Partial<UploadedFile>) => {
        setUploadedFiles(prev =>
            prev.map(file => (file.id === fileId ? { ...file, ...updates } : file))
        );
    };

    return {
        uploadedFiles,
        handleFileUpload,
        handleFileDelete,
        handleFileDownload,
        handleFileUpdate,
        isLoading,
        error,
    };
};