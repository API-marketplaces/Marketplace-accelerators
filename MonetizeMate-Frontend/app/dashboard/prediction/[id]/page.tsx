"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Skeleton } from '../../../components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip';
import { ArrowLeft, AlertTriangle, Award, BarChart, Brain, Gauge, Info, LineChart, PieChart, ShieldAlert, TrendingUp, Users, Zap } from 'lucide-react';
import {
  Area,
  Bar,
  CartesianGrid,
  Legend,
  AreaChart as RechartsAreaChart,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from '../../../components/ui/chart';
import { PredictionData } from '../../../types/prediction';
import { getPredictionData } from '../../../services/prediction.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Progress } from '../../../components/ui/progress';
import { AnomalyTable } from '@/app/components/AnomalyTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';

const panelClass = "bg-[#102235]/95 border-teal-400/20 text-white shadow-[0_18px_55px_rgba(0,229,192,0.08)]";
const nestedPanelClass = "bg-[#183247]/85 border-teal-400/20 text-white";
const headerClass = "border-b border-teal-400/20 bg-emerald-400/5";
const chartAxis = { fill: "rgba(236,253,245,0.72)", fontSize: 12 };
const chartGrid = "rgba(45,212,191,0.12)";
const progressClass = "bg-[#071527] [&>div]:bg-[#00E5C0]";
const sectionTitleClass = "flex items-center justify-between gap-3 text-white";
const titleTextClass = "flex items-center gap-2";
const modelIcons = {
  linear: TrendingUp,
  gradient_boosting: Zap,
  random_forest: Brain,
};
const modelAnalysisProfiles = {
  linear: {
    volumeFactor: 0.92,
    peakFactor: 0.9,
    errorPercentages: [47.2, 29.1, 18.6, 5.1],
    resources: [
      { resource: 'CPU', currentUsage: 60, predictedUsage: 76, unit: 'GHz' },
      { resource: 'Memory', currentUsage: 12, predictedUsage: 13, unit: 'GB' },
    ],
    rateLimitOptimization: {
      description: 'Prediction performed using linear trend analysis to identify endpoints where request growth is steady enough for conservative rate-limit tuning.',
      forecastInsight: 'Based on 10,346 request records, the model found stable growth across core endpoints and recommends smaller limit changes where historical trends are clear.',
      recommendations: [
        { endpoint: '/api/v1/search', currentLimit: 1000, recommendedLimit: 920, insight: 'Steady excess demand trend detected', status: 'reduce' },
        { endpoint: '/api/v1/data', currentLimit: 5000, recommendedLimit: 5750, insight: 'Predictable growth capacity available', status: 'increase' },
        { endpoint: '/api/v1/export', currentLimit: 100, recommendedLimit: 100, insight: 'No meaningful trend shift found', status: 'keep' },
      ],
    },
  },
  gradient_boosting: {
    volumeFactor: 1,
    peakFactor: 1,
    errorPercentages: [50, 27.8, 16.7, 5.5],
    resources: [
      { resource: 'CPU', currentUsage: 60, predictedUsage: 85, unit: 'GHz' },
      { resource: 'Memory', currentUsage: 12, predictedUsage: 14, unit: 'GB' },
    ],
    rateLimitOptimization: {
      description: 'Prediction performed using pattern recognition to analyze request patterns, detect abuse, and optimize rate limits per endpoint based on historical traffic data.',
      forecastInsight: 'Based on 10,346 request records, the model identified endpoint-specific abuse patterns and capacity constraints to recommend optimal rate limits.',
      recommendations: [
        { endpoint: '/api/v1/search', currentLimit: 1000, recommendedLimit: 850, insight: 'High abuse pattern detected', status: 'reduce' },
        { endpoint: '/api/v1/data', currentLimit: 5000, recommendedLimit: 6500, insight: 'Capacity available for growth', status: 'increase' },
        { endpoint: '/api/v1/export', currentLimit: 100, recommendedLimit: 100, insight: 'Optimal configuration', status: 'keep' },
      ],
    },
  },
  random_forest: {
    volumeFactor: 0.97,
    peakFactor: 1.06,
    errorPercentages: [48.4, 25.6, 18.2, 7.8],
    resources: [
      { resource: 'CPU', currentUsage: 60, predictedUsage: 82, unit: 'GHz' },
      { resource: 'Memory', currentUsage: 12, predictedUsage: 15, unit: 'GB' },
    ],
    rateLimitOptimization: {
      description: 'Prediction performed using decision-tree ensembles to compare endpoint behavior, mixed traffic patterns, and quota pressure across user segments.',
      forecastInsight: 'Based on 10,346 request records, the model found higher variance in export and search traffic, so it recommends robust limits that protect peak windows.',
      recommendations: [
        { endpoint: '/api/v1/search', currentLimit: 1000, recommendedLimit: 880, insight: 'Repeated high-variance request clusters detected', status: 'reduce' },
        { endpoint: '/api/v1/data', currentLimit: 5000, recommendedLimit: 6200, insight: 'Healthy throughput under mixed load', status: 'increase' },
        { endpoint: '/api/v1/export', currentLimit: 100, recommendedLimit: 120, insight: 'Short peak bursts can be supported', status: 'increase' },
      ],
    },
  },
} as const;
const infoText = {
  model: "Shows the model selected for this dashboard and how reliable the uploaded data and model output are.",
  users: "Groups users by behavior so non-technical teams can see which customer types create the most API activity.",
  peak: "Shows request volume by time of day. Taller bars mean more requests during that time window.",
  future: "Forecasts upcoming request volume from historical API traffic patterns.",
  rate: "Recommends endpoint rate limits by comparing historical request patterns, traffic spikes, and capacity.",
  quota: "Shows how much of each user's quota is already consumed.",
  resources: "Predicts CPU and memory needs from historical request volume, API count, and traffic trends.",
  anomalies: "Highlights unusual traffic, latency, or resource events that may need review.",
  errors: "Groups API errors by category and shows which APIs are contributing most.",
};
const errorDetails = {
  '500 Internal Server Error': {
    apis: ['/api/v1/users', '/api/v1/payment', '/api/v1/orders', '/api/v1/sync', '/api/v1/report'],
    recommendation: 'API/backend investigation required. Developer intervention needed.',
  },
  '404 Not Found': {
    apis: ['/api/v1/legacy', '/api/v1/profile', '/api/v1/catalog', '/api/v1/search', '/api/v1/files'],
    recommendation: 'Review broken routes, outdated client calls, and missing endpoint mappings.',
  },
  '429 Too Many Requests': {
    apis: ['/api/v1/search', '/api/v1/data', '/api/v1/export', '/api/v1/report', '/api/v1/users'],
    recommendation: 'Too many requests/rate limiting. Optimize traffic handling.',
  },
  '401 Unauthorized': {
    apis: ['/api/v1/token', '/api/v1/users', '/api/v1/data', '/api/v1/admin', '/api/v1/export'],
    recommendation: 'Review expired tokens, invalid credentials, and access policy configuration.',
  },
} as const;

export default function PredictionResultPage() {
  const router = useRouter();
  const params = useParams();
  const fileId = params.id as string;

  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<string>("7d");

  useEffect(() => {
    if (fileId) {
      getPredictionData(fileId)
        .then(setData)
        .catch(err => {
          console.error("Failed to fetch prediction data", err);
          setError("Could not load prediction data for this file.");
        })
        .finally(() => setLoading(false));
    }
  }, [fileId]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#071527] p-8 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const daysByFilter: Record<string, number> = { "1d": 1, "7d": 7, "30d": 30, "90d": 90 };
  const predictionWindow = daysByFilter[timeFilter] ?? 7;
  const futurePredictions = buildPredictionWindow(data.futureVolume?.predictions ?? [], predictionWindow);
  const modelPerformance = data.modelPerformance ?? [];
  const bestModel = modelPerformance.length
    ? modelPerformance.reduce((best, current) => current.accuracy > best.accuracy ? current : best)
    : undefined;
  const selectedModel = modelPerformance.find(model => model.id === "random_forest") ?? bestModel;
  const selectedProfile = modelAnalysisProfiles[(selectedModel?.id ?? "gradient_boosting") as keyof typeof modelAnalysisProfiles] ?? modelAnalysisProfiles.gradient_boosting;
  const futurePredictionsForModel = futurePredictions.map(item => ({
    ...item,
    predicted_request_count: Math.round(item.predicted_request_count * selectedProfile.volumeFactor),
  }));
  const peakUsageForModel = data.peakUsage.map(item => ({
    ...item,
    usage: Math.round(item.usage * selectedProfile.peakFactor),
    period: formatTimeLabel(item.time),
  }));
  const errorClassificationForModel = data.errorClassification.map((item, index) => ({
    ...item,
    percentage: selectedProfile.errorPercentages[index] ?? item.percentage,
  }));
  const rateLimitOptimizationForModel = selectedProfile.rateLimitOptimization;
  const resourceUsageForModel = selectedProfile.resources;

  return (
    <div className="prediction-page min-h-screen bg-[#071527] p-8 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/dashboard/upload?decisionMetrics=prediction')} className="border-teal-400/30 bg-[#00E5C0] text-[#061523] hover:bg-[#5eead4]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Uploads
            </Button>
            <TrendingUp className="w-8 h-8 text-[#00E5C0]" />
            <div>
              <h1 className="text-2xl text-white">Prediction Analysis</h1>
              <p className="text-emerald-100/80">Forecasting, anomaly detection, and usage insights</p>
            </div>
          </div>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger style={{ width: 140, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(0,229,192,0.25)", color: "#fff" }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ background: "#0A1628", border: "1px solid rgba(0,229,192,0.25)", color: "#fff" }}>
              <SelectItem value="1d">Next 24h</SelectItem>
              <SelectItem value="7d">Next 7 days</SelectItem>
              <SelectItem value="30d">Next 30 days</SelectItem>
              <SelectItem value="90d">Next 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Model Summary */}
          <Card className={`lg:col-span-4 ${panelClass}`}>
            <CardHeader className={headerClass}>
              <CardTitle className={sectionTitleClass}>
                <span className={titleTextClass}>
                  <Award className="w-5 h-5" />
                  Model Used
                </span>
                <InfoHint text={infoText.model} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedModel && (
                <div className="rounded-lg border border-teal-400/25 bg-emerald-400/10 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      {(() => {
                        const Icon = modelIcons[selectedModel.id as keyof typeof modelIcons] ?? Brain;
                        return <Icon className="w-5 h-5 text-[#00E5C0] mt-1" />;
                      })()}
                      <div>
                        <h3 className="font-semibold text-white">{selectedModel.name}</h3>
                        <p className="mt-1 text-sm text-emerald-100/80">{selectedModel.description}</p>
                        <p className="mt-2 text-sm text-emerald-100/75">
                          Random Forest compares many small decision trees and combines their votes. For this dashboard, it looks at past requests, endpoints, errors, and usage patterns to estimate the most likely outcome.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:min-w-80">
                      <div className="rounded-md border border-teal-400/20 bg-[#183247]/70 p-3">
                        <p className="text-xs text-emerald-100/65">Input Data Accuracy</p>
                        <p className="mt-1 text-xl font-semibold text-white">{data.inputDataAccuracy.toFixed(1)}%</p>
                      </div>
                      <div className="rounded-md border border-teal-400/20 bg-[#183247]/70 p-3">
                        <p className="text-xs text-emerald-100/65">Model Accuracy</p>
                        <p className="mt-1 text-xl font-semibold text-white">{selectedModel.accuracy.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Pattern Behaviour */}
          <Card className={`lg:col-span-4 ${panelClass}`}>
            <CardHeader className={headerClass}>
              <CardTitle className={sectionTitleClass}>
                <span className={titleTextClass}>
                  <Users className="w-5 h-5" />
                  User Pattern Behaviour
                </span>
                <InfoHint text={infoText.users} />
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.userPatterns.map(pattern => (
                <Card key={pattern.userSegment} className={`p-4 ${nestedPanelClass}`}>
                  <h4 className="font-semibold text-white">{pattern.userSegment}</h4>
                  <p className="text-sm text-white/85 mt-1">{pattern.description}</p>
                  <div className="mt-3">
                    <p className="text-xs text-[#00E5C0]">Avg. Daily Requests: <span className="font-bold">{pattern.avgRequestsPerDay.toLocaleString()}</span></p>
                    <p className="text-xs text-[#00E5C0]">Peak Time: <span className="font-bold">{pattern.peakTime}</span></p>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Peak Usage */}
          <Card className={`lg:col-span-4 ${panelClass}`}>
            <CardHeader className={headerClass}>
              <CardTitle className={sectionTitleClass}>
                <span className={titleTextClass}>
                  <BarChart className="w-5 h-5" />
                  Peak Usage Times
                </span>
                <InfoHint text={infoText.peak} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-emerald-100/75">
                This chart shows request volume by time window. Use it to quickly spot when traffic is quiet, normal, or close to peak capacity.
              </p>
              <ChartContainer config={{}} className="h-80 w-full">
                <ResponsiveContainer>
                  <RechartsBarChart data={peakUsageForModel} margin={{ top: 8, right: 20, left: 8, bottom: 8 }}>
                    <CartesianGrid vertical={false} stroke={chartGrid} />
                    <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} tick={chartAxis} />
                    <YAxis tick={chartAxis} axisLine={{ stroke: "rgba(236,253,245,0.35)" }} tickLine={{ stroke: "rgba(236,253,245,0.25)" }} label={{ value: "Requests", angle: -90, position: "insideLeft", fill: "rgba(236,253,245,0.72)" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#102235", border: "1px solid rgba(45,212,191,0.28)", borderRadius: 8, color: "#fff" }}
                      labelFormatter={(label) => `Time window: ${label}`}
                      formatter={(value) => [`${Number(value).toLocaleString()} requests`, "Request volume"]}
                    />
                    <Bar dataKey="usage" fill="#00E5C0" radius={[6, 6, 0, 0]} name="Requests" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Future Volume Prediction */}
          <Card className={`lg:col-span-4 ${panelClass}`}>
            <CardHeader className={headerClass}>
              <CardTitle className={sectionTitleClass}>
                <span className={titleTextClass}>
                  <LineChart className="w-5 h-5" />
                  Future Request Volume Prediction
                </span>
                <InfoHint text={infoText.future} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-80 w-full">
                <ResponsiveContainer>
                  <RechartsAreaChart data={futurePredictionsForModel}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tick={chartAxis} />
                    <YAxis tick={chartAxis} axisLine={{ stroke: "rgba(236,253,245,0.35)" }} tickLine={{ stroke: "rgba(236,253,245,0.25)" }} />
                    <Tooltip content={<ChartTooltipContent indicator="line" />} />
                    <Legend />
                    <Area type="monotone" dataKey="predicted_request_count" stroke="#00E5C0" fill="#00E5C0" fillOpacity={0.24} name="Predicted" />
                  </RechartsAreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Rate Limit Optimization Forecast */}
          <Card className={`lg:col-span-4 ${panelClass}`}>
            <CardHeader className={headerClass}>
              <CardTitle className={sectionTitleClass}>
                <span className={titleTextClass}>
                  <ShieldAlert className="w-5 h-5 text-[#00E5C0]" />
                  Rate Limit Optimization Forecast
                </span>
                <InfoHint text={infoText.rate} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-teal-400/20 bg-[#183247]/85 p-4">
                <p className="font-semibold text-emerald-100">Forecast Insights:</p>
                <p className="mt-2 text-sm text-emerald-100/85">{rateLimitOptimizationForModel.forecastInsight}</p>
              </div>

              <div className="space-y-3">
                {rateLimitOptimizationForModel.recommendations.map(item => {
                  const badgeClass = item.status === 'reduce'
                    ? 'bg-orange-500 text-white'
                    : item.status === 'increase'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[#00E5C0] text-[#061523]';

                  return (
                    <div key={item.endpoint} className="flex items-center justify-between gap-4 rounded-lg border border-teal-400/20 bg-[#183247]/70 p-4">
                      <div>
                        <p className="font-mono text-sm text-white">{item.endpoint}</p>
                        <p className="mt-2 text-sm text-emerald-100/80">{item.insight}</p>
                      </div>
                      <Badge className={`${badgeClass} shrink-0`}>
                        {item.currentLimit} {'->'} {item.recommendedLimit}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quota Limit Utilization */}
          <Card className={`lg:col-span-4 ${panelClass}`}>
            <CardHeader className={headerClass}>
              <CardTitle className={sectionTitleClass}>
                <span className={titleTextClass}>
                  <ShieldAlert className="w-5 h-5" />
                  Quota Limit Utilization
                </span>
                <InfoHint text={infoText.quota} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-teal-400/20 hover:bg-transparent">
                    <TableHead className="text-emerald-100/80">User ID</TableHead>
                    <TableHead className="text-emerald-100/80">API Key</TableHead>
                    <TableHead className="text-emerald-100/80">Usage</TableHead>
                    <TableHead className="text-emerald-100/80">Quota</TableHead>
                    <TableHead className="text-right text-emerald-100/80">Utilization</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.quotaExceedances.map((item) => (
                    <TableRow key={item.userId} className="border-teal-400/15 hover:bg-emerald-400/5">
                      <TableCell className="font-semibold text-white/90">{item.userId}</TableCell>
                      <TableCell className="font-mono text-white/90">{item.apiKey}</TableCell>
                      <TableCell className="text-white/90">{item.usage.toLocaleString()}</TableCell>
                      <TableCell className="text-white/90">{item.quota.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-white/90">
                        <div className="flex items-center justify-end gap-2">
                          <span>{item.exceedancePercentage}%</span>
                          <Progress value={item.exceedancePercentage} className={`w-24 ${progressClass}`} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Predicted Resource Usage */}
          <Card className={`lg:col-span-4 ${panelClass}`}>
            <CardHeader className={headerClass}>
              <CardTitle className={sectionTitleClass}>
                <span className={titleTextClass}>
                  <Gauge className="w-5 h-5" />
                  Predicted Resource Usage
                </span>
                <InfoHint text={infoText.resources} />
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resourceUsageForModel.map(resource => (
                <Card key={resource.resource} className={`p-4 ${nestedPanelClass}`}>
                  <h4 className="text-lg font-semibold text-white">{resource.resource}</h4>
                  <p className="mt-2 text-sm text-emerald-100/85">
                    Current {resource.resource.toLowerCase()} consumption = {resource.currentUsage} {resource.unit}.
                  </p>
                  <p className="mt-2 text-sm text-[#00E5C0]">
                    Based on historical request volume, API count, and recent traffic trends, predicted usage = {resource.predictedUsage} {resource.unit}.
                  </p>
                  <p className="mt-2 text-xs text-emerald-100/65">
                    Prediction assumes request volume remains the same or increases.
                  </p>
                  <Progress value={(resource.predictedUsage / (resource.currentUsage * 2)) * 100} className={`mt-2 ${progressClass}`} />
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Anomalies */}
          <Card className={`lg:col-span-4 ${panelClass}`}>
            <CardHeader className={headerClass}>
              <CardTitle className={sectionTitleClass}>
                <span className={titleTextClass}>
                  <AlertTriangle className="w-5 h-5" />
                  Detected Anomalies
                </span>
                <InfoHint text={infoText.anomalies} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnomalyTable anomalies={[
                ...(data.anomalies?.request_spike ?? []),
                ...(data.anomalies?.latency_spike ?? []),
                ...(data.anomalies?.resource_spike ?? []),
              ]} />
            </CardContent>
          </Card>

          {/* Error Classification */}
          <Card className={`lg:col-span-4 ${panelClass}`}>
            <CardHeader className={headerClass}>
              <CardTitle className={sectionTitleClass}>
                <span className={titleTextClass}>
                  <PieChart className="w-5 h-5" />
                  Error Classification
                </span>
                <InfoHint text={infoText.errors} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {errorClassificationForModel.map(error => {
                  const detail = errorDetails[error.errorType as keyof typeof errorDetails];

                  return (
                    <div key={error.errorType} className="rounded-lg border border-teal-400/20 bg-[#183247]/65 p-4">
                      <div className="flex justify-between gap-3 mb-2">
                        <ErrorHover label={error.errorType} apis={detail?.apis ?? []} />
                        <span className="text-sm font-semibold text-white">{error.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-[#071527] rounded-full h-2.5">
                        <div className="bg-[#00E5C0] h-2.5 rounded-full" style={{ width: `${error.percentage}%` }}></div>
                      </div>
                      <p className="mt-3 text-sm text-emerald-100/80">
                        {detail?.recommendation ?? 'Review API logs and isolate the most frequent failing endpoints.'}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 rounded-lg border border-teal-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                Action item: Fix these errors to improve resource utilization and system efficiency.
              </div>
            </CardContent>
          </Card>

        </div>

        <div className="text-center pt-8 pb-4">
          <button
            onClick={() => router.push('/dashboard')}
            style={{ background: "linear-gradient(135deg, #00E5C0, #1ABFA3)", color: "#060E1E", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8, border: "none", cursor: "pointer" }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>
      </div>
      <style>{`
        .prediction-page .recharts-cartesian-axis-tick-value {
          fill: rgba(236, 253, 245, 0.72);
        }

        .prediction-page .recharts-legend-item-text {
          color: rgba(236, 253, 245, 0.86) !important;
        }

        .prediction-page .recharts-tooltip-wrapper {
          color: #071527;
        }
      `}</style>
    </div>
  );
}

function InfoHint({ text }: { text: string }) {
  return (
    <UiTooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Analysis explanation"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-teal-400/30 bg-[#071527] text-emerald-100 transition hover:border-[#00E5C0] hover:text-[#00E5C0]"
        >
          <Info className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-72 border border-teal-400/25 bg-[#102235] text-emerald-50">
        {text}
      </TooltipContent>
    </UiTooltip>
  );
}

function ErrorHover({ label, apis }: { label: string; apis: readonly string[] }) {
  return (
    <UiTooltip>
      <TooltipTrigger asChild>
        <button type="button" className="text-left text-sm font-semibold text-white underline decoration-teal-300/40 underline-offset-4">
          {label}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-80 border border-teal-400/25 bg-[#102235] text-emerald-50">
        <div className="space-y-2">
          <p className="font-semibold">Top contributing APIs</p>
          <ol className="list-decimal space-y-1 pl-4">
            {apis.slice(0, 5).map(api => (
              <li key={api} className="font-mono text-xs">{api}</li>
            ))}
          </ol>
        </div>
      </TooltipContent>
    </UiTooltip>
  );
}

function formatTimeLabel(time: string) {
  const [hourValue] = time.split(":");
  const hour = Number(hourValue);

  if (Number.isNaN(hour)) {
    return time;
  }

  if (hour === 0) {
    return "12 AM";
  }

  if (hour < 12) {
    return `${hour} AM`;
  }

  if (hour === 12) {
    return "12 PM";
  }

  return `${hour - 12} PM`;
}

function buildPredictionWindow(
  basePredictions: Array<{ date: string; predicted_request_count: number }>,
  days: number,
) {
  if (!basePredictions.length) {
    return [];
  }

  const predictions = [...basePredictions];
  const lastPrediction = predictions[predictions.length - 1];
  const previousPrediction = predictions[predictions.length - 2] ?? lastPrediction;
  const dailyGrowth = Math.max(
    25,
    lastPrediction.predicted_request_count - previousPrediction.predicted_request_count,
  );
  const lastDate = new Date(lastPrediction.date);

  while (predictions.length < days) {
    const nextIndex = predictions.length - basePredictions.length + 1;
    const nextDate = new Date(lastDate);
    nextDate.setDate(lastDate.getDate() + nextIndex);

    const weeklySeasonality = Math.sin((predictions.length / 7) * Math.PI) * 55;
    const nextValue = Math.round(
      lastPrediction.predicted_request_count + dailyGrowth * nextIndex + weeklySeasonality,
    );

    predictions.push({
      date: nextDate.toISOString().slice(0, 10),
      predicted_request_count: nextValue,
    });
  }

  return predictions.slice(0, days);
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-10 w-40" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div>
              <Skeleton className="h-7 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-4 bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent><Skeleton className="h-64 w-full" /></CardContent>
          </Card>
          <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card className="lg:col-span-4 bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent><Skeleton className="h-80 w-full" /></CardContent>
          </Card>
          <Card className="lg:col-span-4 bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent><Skeleton className="h-32 w-full" /></CardContent>
          </Card>
          <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent><Skeleton className="h-64 w-full" /></CardContent>
          </Card>
          <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          <Card className="lg:col-span-4 bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent><Skeleton className="h-32 w-full" /></CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
