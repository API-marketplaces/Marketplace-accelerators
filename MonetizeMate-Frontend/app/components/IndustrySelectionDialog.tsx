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
    const [customIndustry, setCustomIndustry] = useState('');
    const [error, setError] = useState('');

    const handleContinue = () => {
        const industry = selectedIndustry === 'Other' ? customIndustry.trim() : selectedIndustry;

        if (!selectedIndustry) {
            setError('Please select an industry to continue.');
            return;
        }

        if (selectedIndustry === 'Other' && !industry) {
            setError('Please enter your industry name.');
            return;
        }

        onContinue(industry);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="industry-dialog">
                <DialogHeader>
                    <DialogTitle className="industry-dialog-title">
                        <Building2 className="w-6 h-6" />
                        Select Your Industry
                    </DialogTitle>
                </DialogHeader>
                <div className="industry-dialog-body">
                    <div className="industry-dialog-field">
                        <Label>What industry does your business operate in?</Label>
                        <Select
                            value={selectedIndustry}
                            onValueChange={(value) => {
                                setSelectedIndustry(value);
                                setError('');
                                if (value !== 'Other') setCustomIndustry('');
                            }}
                        >
                            <SelectTrigger className="industry-select-trigger">
                                <SelectValue placeholder="Choose your industry..." />
                            </SelectTrigger>
                            <SelectContent className="industry-select-content">
                                {INDUSTRIES.map((industry) => (
                                    <SelectItem key={industry} value={industry} className="industry-select-item">
                                        {industry}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {selectedIndustry === 'Other' && (
                        <div className="industry-dialog-field">
                            <Label htmlFor="customIndustry">Industry name</Label>
                            <input
                                id="customIndustry"
                                value={customIndustry}
                                onChange={(event) => {
                                    setCustomIndustry(event.target.value);
                                    setError('');
                                }}
                                className="industry-other-input"
                                placeholder="Enter your industry"
                            />
                        </div>
                    )}
                    {error && <p className="industry-dialog-error">{error}</p>}
                    <Button
                        onClick={handleContinue}
                        disabled={!selectedIndustry}
                        className="industry-dialog-button"
                    >
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
                <style>{`
                    .industry-dialog {
                        border: 1px solid rgba(0, 229, 192, 0.26);
                        border-radius: 18px;
                        background:
                            radial-gradient(circle at 18% 0%, rgba(0, 229, 192, 0.16), transparent 34%),
                            linear-gradient(145deg, rgba(17, 34, 54, 0.98), rgba(9, 22, 38, 0.98));
                        color: #ffffff;
                        box-shadow: 0 28px 80px rgba(0, 0, 0, 0.4);
                    }

                    .industry-dialog-title {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        color: #ffffff;
                        font-size: 22px;
                        font-weight: 800;
                    }

                    .industry-dialog-title svg {
                        color: #00e5c0;
                    }

                    .industry-dialog-body {
                        padding-top: 18px;
                    }

                    .industry-dialog-field {
                        display: grid;
                        gap: 10px;
                        margin-bottom: 18px;
                    }

                    .industry-dialog-field label {
                        color: rgba(255, 255, 255, 0.86);
                        font-size: 14px;
                        font-weight: 800;
                    }

                    .industry-select-trigger,
                    .industry-other-input {
                        width: 100%;
                        height: 48px;
                        border-radius: 10px;
                        border: 1px solid rgba(0, 229, 192, 0.3);
                        background: rgba(31, 47, 68, 0.98);
                        color: #ffffff;
                        font-size: 15px;
                        font-weight: 700;
                        outline: none;
                    }

                    .industry-other-input {
                        padding: 0 14px;
                    }

                    .industry-other-input::placeholder {
                        color: rgba(255, 255, 255, 0.36);
                    }

                    .industry-select-trigger:focus,
                    .industry-other-input:focus {
                        border-color: #8ffcf0;
                        box-shadow: 0 0 0 3px rgba(143, 252, 240, 0.16);
                    }

                    .industry-select-content {
                        border: 1px solid rgba(0, 229, 192, 0.22);
                        background: #ffffff;
                        color: #102033;
                    }

                    .industry-select-item {
                        color: #102033;
                        font-weight: 700;
                    }

                    .industry-select-item[data-highlighted] {
                        background: #11d3ba;
                        color: #061421;
                    }

                    .industry-dialog-error {
                        margin: -4px 0 16px;
                        color: #fecaca;
                        font-size: 13px;
                        font-weight: 800;
                    }

                    .industry-dialog-button {
                        width: 100%;
                        height: 48px;
                        border-radius: 10px;
                        background: #11d3ba;
                        color: #061421;
                        font-weight: 900;
                    }

                    .industry-dialog-button:hover {
                        background: #38e6d0;
                        color: #061421;
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    );
}
