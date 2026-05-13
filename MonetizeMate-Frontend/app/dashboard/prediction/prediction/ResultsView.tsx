import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Progress } from "../../../components/ui/progress";
import { ArrowLeft, Brain, BarChart3, Cpu, Award, Trophy } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MLModel, PredictionType } from "../../../types/prediction";
import { UploadedFile } from "../../../types/UploadedFile";
import { MOCK_PREDICTION_RESULTS } from "./constants";

interface ResultsViewProps {
  onBack: () => void;
  onReturnToDashboard: () => void;
  selectedFile: UploadedFile | undefined;
  selectedModels: string[];
  selectedPredictions: string[];
  dataQuality: number;
  trainedModels: MLModel[];
  predictionTypes: PredictionType[];
}

export default function ResultsView({
  onBack,
  onReturnToDashboard,
  selectedFile,
  selectedModels,
  selectedPredictions,
  dataQuality,
  trainedModels,
  predictionTypes
}: ResultsViewProps) {
  const bestModel = trainedModels.reduce((best, current) => 
    current.accuracy > best.accuracy ? current : best
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack} className="border-blue-300 text-blue-700 hover:bg-blue-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Configuration
            </Button>
            <div>
              <h1 className="text-2xl text-blue-900">ML Prediction Results</h1>
              <p className="text-blue-700">Model performance and predictions based on your data</p>
            </div>
          </div>
        </div>

        {/* Data Source */}
        {selectedFile && (
          <Card className="p-4 mb-8 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-blue-900">Analysis based on: <span className="font-medium">{selectedFile.displayName || selectedFile.name}</span></p>
                <p className="text-sm text-blue-600">
                  {selectedModels.length} models trained • {selectedPredictions.length} prediction types • 
                  Data quality: {dataQuality}% • {selectedFile.data?.length || 0} records
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Model Performance Comparison */}
        <Card className="p-6 mb-8 bg-white/80 backdrop-blur-sm border-blue-200">
          <h3 className="text-xl text-blue-900 mb-6">Model Performance Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trainedModels.map((model) => {
              const IconComponent = model.icon;
              const isBest = model.id === bestModel.id;
              return (
                <div key={model.id} className={`p-4 rounded-lg border-2 ${
                  isBest ? 'border-green-400 bg-green-50' : 'border-blue-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <IconComponent className={`w-5 h-5 ${model.color}`} />
                      <h4 className="text-blue-900">{model.name}</h4>
                    </div>
                    {isBest && (
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-green-600" />
                        <Badge className="bg-green-500 text-white text-xs">Best</Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-blue-600">Accuracy</span>
                        <span className="text-blue-900 font-medium">{model.accuracy.toFixed(1)}%</span>
                      </div>
                      <Progress value={model.accuracy} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-blue-600">Training Time</span>
                        <p className="text-blue-900">{model.trainingTime}</p>
                      </div>
                      <div>
                        <span className="text-blue-600">Model Type</span>
                        <p className="text-blue-900">
                          {model.id === 'linear' ? 'Linear' : 'Ensemble'}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-blue-600 text-xs mb-1">Best For:</p>
                      <div className="flex flex-wrap gap-1">
                        {model.bestFor.slice(0, 2).map((item, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Model Recommendation */}
        <Card className="p-6 mb-8 bg-white/80 backdrop-blur-sm border-blue-200">
          <h3 className="text-xl text-blue-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600" />
            Model Recommendation
          </h3>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-start gap-3">
              <bestModel.icon className={`w-6 h-6 ${bestModel.color} mt-1`} />
              <div className="flex-grow">
                <h4 className="text-green-900 mb-2">
                  Recommended: {bestModel.name} ({bestModel.accuracy.toFixed(1)}% accuracy)
                </h4>
                <p className="text-green-800 text-sm mb-3">{bestModel.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-green-800 text-sm mb-1">Why this model:</p>
                    <ul className="text-xs text-green-700 space-y-1">
                      {bestModel.strengths.map((strength, idx) => (
                        <li key={idx}>• {strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-green-800 text-sm mb-1">Data characteristics:</p>
                    <ul className="text-xs text-green-700 space-y-1">
                      <li>• Data quality: {dataQuality}%</li>
                      <li>• Sample size: {selectedFile?.data?.length || 0} records</li>
                      <li>• Prediction types: {selectedPredictions.length}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Prediction Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Request Volume Predictions */}
          {selectedPredictions.includes('request_volume') && (
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-blue-200">
              <h4 className="text-xl text-blue-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Future Request Volume
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={MOCK_PREDICTION_RESULTS.request_volume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis dataKey="period" stroke="#3b82f6" />
                  <YAxis stroke="#3b82f6" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #3b82f6',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="predicted" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Predicted Requests"
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Growth Rate</span>
                  <p className="text-blue-900 font-medium">+21.6% over 4 weeks</p>
                </div>
                <div>
                  <span className="text-blue-600">Confidence</span>
                  <p className="text-blue-900 font-medium">89.5% average</p>
                </div>
              </div>
            </Card>
          )}

          {/* Resource Predictions */}
          {selectedPredictions.includes('resource_prediction') && (
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-blue-200">
              <h4 className="text-xl text-blue-900 mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                Resource Usage Forecast
              </h4>
              <div className="space-y-4">
                {MOCK_PREDICTION_RESULTS.resource_prediction.map((resource, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-blue-900 font-medium">{resource.metric}</p>
                      <p className="text-blue-600 text-sm">
                        {resource.current} → {resource.predicted}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={resource.change.startsWith('+') ? "default" : "secondary"}
                        className={resource.change.startsWith('+') ? "bg-orange-500" : "bg-green-500"}
                      >
                        {resource.change}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Additional Predictions Summary */}
        {selectedPredictions.length > 2 && (
          <Card className="p-6 mb-8 bg-white/80 backdrop-blur-sm border-blue-200">
            <h3 className="text-xl text-blue-900 mb-4">Additional Prediction Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedPredictions.slice(2).map(predId => {
                const predType = predictionTypes.find(p => p.id === predId);
                if (!predType) return null;
                
                return (
                  <div key={predId} className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <predType.icon className="w-4 h-4 text-blue-600" />
                      <h5 className="text-blue-900 text-sm font-medium">{predType.name}</h5>
                    </div>
                    <p className="text-blue-600 text-xs mb-2">{predType.description}</p>
                    <Badge variant="outline" className="text-xs">
                      Model trained • {Math.floor(Math.random() * 15 + 85)}% accuracy
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="text-center">
          <Button 
            onClick={onReturnToDashboard}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}