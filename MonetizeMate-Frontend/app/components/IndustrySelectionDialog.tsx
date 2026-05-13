'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { ArrowRight, Building2 } from 'lucide-react';
import { INDUSTRIES } from '../constants/strategy-constants';

interface IndustrySelectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onContinue: (industry: string) => void;
}

export default function IndustrySelectionDialog({ open, onOpenChange, onContinue }: IndustrySelectionDialogProps) {
    const [selectedIndustry, setSelectedIndustry] = useState<string>('');

    const handleContinue = () => {
        if (selectedIndustry) {
            onContinue(selectedIndustry);
        } else {
            alert('Please select an industry to continue.');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white/80 backdrop-blur-sm border-blue-200">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-blue-900">
                        <Building2 className="w-6 h-6" />
                        Select Your Industry
                    </DialogTitle>
                </DialogHeader>
                <div className="pt-4">
                    <div className="mb-6">
                        <Label className="text-blue-900 mb-2 block">What industry does your business operate in?</Label>
                        <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Choose your industry..." />
                            </SelectTrigger>
                            <SelectContent>
                                {INDUSTRIES.map((industry) => (
                                    <SelectItem key={industry} value={industry}>
                                        {industry}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        onClick={handleContinue}
                        disabled={!selectedIndustry}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}