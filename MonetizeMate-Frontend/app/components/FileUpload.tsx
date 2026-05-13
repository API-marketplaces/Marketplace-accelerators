'use client'

import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Upload, FileText, Download, Trash2, Edit3, Calendar, FileSpreadsheet, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { UploadedFile } from "../types/UploadedFile";


interface FileUploadProps {
    uploadedFiles: UploadedFile[];
    selectedFileId?: string;
    onFileUpload: (file: File, displayName?: string, description?: string) => Promise<UploadedFile | null>;
    onFileDelete: (fileId: string) => void;
    onFileDownload: (fileId: string) => void;
    onFileUpdate: (fileId: string, updates: Partial<UploadedFile>) => void;
    onFileSelect?: (fileId: string) => void;
    title?: string;
    description?: string;
    acceptedTypes?: string[];
}

export default function FileUpload({
    uploadedFiles,
    selectedFileId,
    onFileUpload,
    onFileDelete,
    onFileDownload,
    onFileUpdate,
    onFileSelect,
    title = "Upload Your Files",
    description = "Upload CSV or Excel files for analysis",
    acceptedTypes = [".csv", ".xlsx", ".xls"]
}: FileUploadProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [uploadDisplayName, setUploadDisplayName] = useState("");
    const [uploadDescription, setUploadDescription] = useState("");
    const [editingFile, setEditingFile] = useState<UploadedFile | null>(null);
    const [editDisplayName, setEditDisplayName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingFileRef = useRef<File | null>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            const file = files[0];
            if (isValidFileType(file)) {
                pendingFileRef.current = file;
                setUploadDisplayName(file.name);
                setUploadDescription("");
                setShowUploadDialog(true);
            } else {
                alert(`Please upload a valid file type: ${acceptedTypes.join(", ")}`);
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (isValidFileType(file)) {
                pendingFileRef.current = file;
                setUploadDisplayName(file.name);
                setUploadDescription("");
                setShowUploadDialog(true);
            } else {
                alert(`Please upload a valid file type: ${acceptedTypes.join(", ")}`);
            }
        }
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const isValidFileType = (file: File): boolean => {
        return acceptedTypes.some(type =>
            file.name.toLowerCase().endsWith(type.toLowerCase()) ||
            file.type.includes(type.replace(".", ""))
        );
    };

    const handleUploadConfirm = async () => {
        if (pendingFileRef.current) {
            setIsUploading(true);
            try {
                const newFile = await onFileUpload(
                    pendingFileRef.current,
                    uploadDisplayName.trim() || pendingFileRef.current.name,
                    uploadDescription.trim()
                );

                if (newFile) {
                    console.log('File uploaded successfully:', {
                        id: newFile.id,
                        name: newFile.name,
                        records: newFile.data?.length || 0
                    });
                    // Auto-select the new file if there's a selection handler
                    if (onFileSelect) {
                        onFileSelect(newFile.id);
                    }
                    pendingFileRef.current = null;
                    setUploadDisplayName("");
                    setUploadDescription("");
                    setShowUploadDialog(false);
                }
            } catch (error: any) {
                console.error('Error uploading file:', error);
                alert('Error uploading file: ' + (error?.message || 'Unknown error'));
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleEditFile = (file: UploadedFile) => {
        setEditingFile(file);
        setEditDisplayName(file.displayName || file.name);
        setEditDescription(file.description || "");
    };

    const handleEditConfirm = () => {
        if (editingFile) {
            onFileUpdate(editingFile.id, {
                displayName: editDisplayName.trim() || editingFile.name,
                description: editDescription.trim()
            });
            setEditingFile(null);
            setEditDisplayName("");
            setEditDescription("");
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (date: Date | string | undefined): string => {
        if (!date) return '';
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) return 'Invalid Date';
        return dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFileIcon = (file: UploadedFile) => {
        console.log(file);
        if (file.name?.endsWith('.xlsx') || file.name?.endsWith('.xls') || file.name?.endsWith('.csv')) {
            return FileSpreadsheet;
        }
        return FileText;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Area */}
            <div>
                <h3 className="text-xl text-blue-900 mb-4">{title}</h3>
                <p className="text-blue-600 mb-6">{description}</p>

                <Card
                    className={`p-8 border-2 border-dashed transition-all duration-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-blue-300 bg-blue-50/30'
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Upload className="w-8 h-8 text-blue-600" />
                        </div>
                        <h4 className="text-blue-900 mb-2">Drop files here or click to browse</h4>
                        <p className="text-blue-600 text-sm mb-4">
                            Supported formats: {acceptedTypes.join(", ")}
                        </p>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            Choose Files
                        </Button>
                    </div>
                </Card>

                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={acceptedTypes.join(",")}
                    onChange={handleFileSelect}
                />
            </div>

            {/* File List */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl text-blue-900">Your Files</h3>
                    <Badge variant="outline" className="text-blue-600 border-blue-300">
                        {uploadedFiles.length} files
                    </Badge>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {uploadedFiles.length === 0 ? (
                        <Card className="p-6 bg-gray-50/50 border-gray-200">
                            <div className="text-center text-gray-500">
                                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No files uploaded yet</p>
                            </div>
                        </Card>
                    ) : (
                        uploadedFiles.map((file) => {
                            const FileIcon = getFileIcon(file);
                            const isSelected = selectedFileId === file.id;

                            return (
                                <Card
                                    key={file.id}
                                    className={`p-4 transition-all duration-200 cursor-pointer hover:shadow-md ${isSelected
                                        ? 'ring-2 ring-blue-400 bg-blue-50 border-blue-300'
                                        : 'bg-white border-blue-200 hover:border-blue-300'
                                        }`}
                                    onClick={() => onFileSelect?.(file.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-blue-100' : 'bg-gray-100'
                                            }`}>
                                            <FileIcon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                                        </div>

                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-grow">
                                                    <h4 className={`truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                                        {file.displayName}
                                                    </h4>
                                                    {file.description && (
                                                        <p className={`text-xs mt-1 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`}>
                                                            {file.description}
                                                        </p>
                                                    )}
                                                    <div className={`flex items-center gap-4 mt-2 text-xs ${isSelected ? 'text-blue-600' : 'text-gray-500'
                                                        }`}>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatDate(file.uploadDate)}
                                                        </span>
                                                        <span>{formatFileSize(file.size)}</span>

                                                        <span>{file.records} {file.records === 1 ? 'record' : 'records'}</span>

                                                    </div>
                                                </div>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e: any) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e: any) => {
                                                            e.stopPropagation();
                                                            handleEditFile(file);
                                                        }}>
                                                            <Edit3 className="w-4 h-4 mr-2" />
                                                            Edit Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e: any) => {
                                                            e.stopPropagation();
                                                            onFileDownload(file.id);
                                                        }}>
                                                            <Download className="w-4 h-4 mr-2" />
                                                            Download
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={(e: any) => {
                                                                e.stopPropagation();
                                                                if (confirm('Are you sure you want to delete this file?')) {
                                                                    onFileDelete(file.id);
                                                                }
                                                            }}
                                                            className="text-red-600 focus:text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Upload Dialog */}
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>Add File Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="displayName">Display Name</Label>
                            <Input
                                id="displayName"
                                value={uploadDisplayName}
                                onChange={(e) => setUploadDisplayName(e.target.value)}
                                placeholder="Enter a descriptive name for this file"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                value={uploadDescription}
                                onChange={(e) => setUploadDescription(e.target.value)}
                                placeholder="Add details about this file's contents or purpose"
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={isUploading}>
                                Cancel
                            </Button>
                            <Button onClick={handleUploadConfirm} className="bg-blue-600 hover:bg-blue-700" disabled={isUploading}>
                                {isUploading ? "Uploading..." : "Upload File"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editingFile} onOpenChange={() => setEditingFile(null)}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle>Edit File Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="editDisplayName">Display Name</Label>
                            <Input
                                id="editDisplayName"
                                value={editDisplayName}
                                onChange={(e) => setEditDisplayName(e.target.value)}
                                placeholder="Enter a descriptive name for this file"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="editDescription">Description</Label>
                            <Textarea
                                id="editDescription"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Add details about this file's contents or purpose"
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditingFile(null)}>
                                Cancel
                            </Button>
                            <Button onClick={handleEditConfirm} className="bg-blue-600 hover:bg-blue-700">
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}