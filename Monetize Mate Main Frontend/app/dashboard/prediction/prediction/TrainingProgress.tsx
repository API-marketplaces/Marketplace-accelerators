import { Card } from "../../../components/ui/card";
import { Progress } from "../../../components/ui/progress";
import { UploadedFile } from "../../../types/UploadedFile";

interface TrainingProgressProps {
  selectedModels: string[];
  selectedPredictions: string[];
  selectedFile: UploadedFile | undefined;
}

export default function TrainingProgress({ 
  selectedModels, 
  selectedPredictions, 
  selectedFile 
}: TrainingProgressProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
      <Card className="p-12 max-w-lg text-center bg-white/80 backdrop-blur-sm border-blue-200">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <h2 className="text-xl text-blue-900 mb-4">Training ML Models</h2>
        <p className="text-blue-600 mb-6">
          Training {selectedModels.length} machine learning models on your data for {selectedPredictions.length} prediction types...
        </p>
        <div className="space-y-3 text-sm text-blue-500">
          <p>✓ Preprocessing {selectedFile?.displayName || selectedFile?.name}</p>
          <p>✓ Feature engineering and selection</p>
          <p>⏳ Training Linear Regression model</p>
          <p className="opacity-50">⏳ Training Gradient Boosting model</p>
          <p className="opacity-50">⏳ Training Random Forest model</p>
          <p className="opacity-50">⏳ Evaluating model performance</p>
        </div>
        <div className="mt-6">
          <Progress value={65} className="h-2" />
          <p className="text-xs text-blue-500 mt-2">Training Progress: 65%</p>
        </div>
      </Card>
    </div>
  );
}