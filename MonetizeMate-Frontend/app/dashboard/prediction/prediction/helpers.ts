import { DataAttribute } from "../../../types/prediction";
import { UploadedFile } from "../../../types/UploadedFile";

export const calculateModelAccuracy = (
  modelId: string, 
  selectedFile: UploadedFile | undefined, 
  dataQuality: number
): number => {
  let baseAccuracy = 75;
  
  if (selectedFile?.data && selectedFile.data.length > 0) {
    const dataSize = selectedFile.data.length;
    
    if (dataSize > 1000) baseAccuracy += 10;
    if (dataSize > 5000) baseAccuracy += 5;
    if (dataQuality > 80) baseAccuracy += 10;
    if (dataQuality > 90) baseAccuracy += 5;
    
    switch (modelId) {
      case "linear":
        baseAccuracy -= 5;
        break;
      case "gradient_boosting":
        baseAccuracy += 8;
        break;
      case "random_forest":
        baseAccuracy += 5;
        break;
    }
  }
  
  const variance = Math.random() * 6 - 3;
  return Math.min(Math.max(baseAccuracy + variance, 60), 98);
};

export const getDataQuality = (dataAttributes: DataAttribute[]): number => {
  const presentAttributes = dataAttributes.filter(attr => attr.present).length;
  const totalAttributes = dataAttributes.length;
  const baseQuality = (presentAttributes / totalAttributes) * 100;
  
  const requiredPresent = dataAttributes.filter(attr => attr.required && attr.present).length;
  const totalRequired = dataAttributes.filter(attr => attr.required).length;
  const requiredBonus = totalRequired > 0 ? (requiredPresent / totalRequired) * 20 : 0;
  
  return Math.min(Math.round(baseQuality + requiredBonus), 100);
};

export const getRecommendedModel = (
  selectedFile: UploadedFile | undefined,
  dataQuality: number,
  selectedPredictions: string[]
): string => {
  if (!selectedFile?.data) return "gradient_boosting";
  
  const dataSize = selectedFile.data.length;
  const hasComplexPredictions = selectedPredictions.some(p => 
    ["anomaly_detection", "error_classification", "user_behavior"].includes(p)
  );
  
  if (dataSize < 500 || dataQuality < 60) {
    return "linear";
  } else if (hasComplexPredictions || dataQuality > 85) {
    return "gradient_boosting";
  } else {
    return "random_forest";
  }
};

export const updateDataAttributes = (
  dataAttributes: DataAttribute[],
  selectedFile: UploadedFile | undefined
): DataAttribute[] => {
  if (!selectedFile?.data || selectedFile.data.length === 0) {
    return dataAttributes;
  }

  const sampleData = selectedFile.data[0];
  const dataKeys = Object.keys(sampleData).map(key => key.toLowerCase().trim());
  
  return dataAttributes.map(attr => ({
    ...attr,
    present: attr.mappedKeys.some(mappedKey => 
      dataKeys.some(dataKey => 
        dataKey === mappedKey.toLowerCase() || 
        dataKey.includes(mappedKey.toLowerCase()) ||
        mappedKey.toLowerCase().includes(dataKey)
      )
    )
  }));
};

export const getAvailablePredictions = (
  predictionTypes: any[],
  dataAttributes: DataAttribute[]
): string[] => {
  return predictionTypes.filter(predType => {
    const hasRequiredAttrs = predType.requiredAttributes.every((reqAttr: string) => {
      return dataAttributes.find(attr => attr.name === reqAttr)?.present;
    });
    return hasRequiredAttrs;
  }).map(p => p.id);
};