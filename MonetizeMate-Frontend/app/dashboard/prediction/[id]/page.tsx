"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { ArrowLeft, AlertTriangle, BarChart, LineChart, PieChart, TrendingUp, Users, Gauge, ShieldAlert, Clock } from 'lucide-react';
import {
  Area,
  Bar,
  CartesianGrid,
  Legend,
  Line,
  AreaChart as RechartsAreaChart,
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../../../components/ui/chart';
import { PredictionData, Anomaly } from '../../../types/prediction';
import { getPredictionData } from '../../../services/prediction.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Progress } from '../../../components/ui/progress';
import { AnomalyTable } from '@/app/components/AnomalyTable';

const panelClass = "bg-[#102235]/95 border-teal-400/20 text-white shadow-[0_18px_55px_rgba(0,229,192,0.08)]";
const nestedPanelClass = "bg-[#183247]/85 border-teal-400/20 text-white";
const headerClass = "border-b border-teal-400/20 bg-emerald-400/5";
const titleClass = "flex items-center gap-2 text-white";
const chartAxis = { fill: "rgba(236,253,245,0.72)", fontSize: 12 };
const chartGrid = "rgba(45,212,191,0.12)";
const progressClass = "bg-[#071527] [&>div]:bg-[#00E5C0]";

export default function PredictionResultPage() {
  const router = useRouter();
  const params = useParams();
  const fileId = params.id as string;

  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'default';
    }
  };

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

  return (
    <div className="prediction-page min-h-screen bg-[#071527] p-8 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => router.push('/dashboard/upload')} className="border-teal-400/30 bg-[#00E5C0] text-[#061523] hover:bg-[#5eead4]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Uploads
          </Button>
          <div className="flex items-center gap-4">
            <TrendingUp className="w-8 h-8 text-[#00E5C0]" />
            <div>
              <h1 className="text-2xl text-white">Prediction Analysis</h1>
              <p className="text-emerald-100/80">Results for file ID: {fileId}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Anomalies */}
          <Card className={`lg:col-span-4 ${panelClass}`}>
            <CardHeader className={headerClass}>
              <CardTitle className={titleClass}>
                <AlertTriangle className="w-5 h-5" />
                Detected Anomalies
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

          {/* Peak Usage */}
          <Card className={`lg:col-span-2 ${panelClass}`}>
            <CardHeader className={headerClass}>
              <CardTitle className={titleClass}>
                <BarChart className="w-5 h-5" />
                Peak Usage Times
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-64 w-full">
                <ResponsiveContainer>
                  <RechartsBarChart data={data.peakUsage}>
                    <CartesianGrid vertical={false} stroke={chartGrid} />
                    <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} tick={chartAxis} />
                    <YAxis tick={chartAxis} axisLine={{ stroke: "rgba(236,253,245,0.35)" }} tickLine={{ stroke: "rgba(236,253,245,0.25)" }} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="usage" fill="var(--color-fill, #3b82f6)" radius={4} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Error Classification */}
          <Card className={`lg:col-span-2 ${panelClass}`}>
            <CardHeader className={headerClass}>
              <CardTitle className={titleClass}>
                <PieChart className="w-5 h-5" />
                Error Classification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.errorClassification.map(error => (
                  <div key={error.errorType}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-white/90">{error.errorType}</span>
                      <span className="text-sm font-semibold text-white">{error.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-[#071527] rounded-full h-2.5">
                      <div className="bg-[#00E5C0] h-2.5 rounded-full" style={{ width: `${error.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Future Volume Prediction */}
          <Card className={`lg:col-span-4 ${panelClass}`}>
            <CardHeader className={headerClass}>
              <CardTitle className={titleClass}>
                <LineChart className="w-5 h-5" />
                Future Request Volume Prediction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-80 w-full">
                <ResponsiveContainer>
                  <RechartsAreaChart data={data.futureVolume?.predictions ?? []}>
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

          {/* Quota Limit Exceedance */}
          <Card className={`lg:col-span-4 ${panelClass}`}>
            <CardHeader className={headerClass}>
              <CardTitle className={titleClass}>
                <ShieldAlert className="w-5 h-5" />
                Quota Limit Exceedance
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
                    <TableHead className="text-right text-emerald-100/80">Exceedance</TableHead>
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

          {/* Rate Limit Prediction */}
          <Card className={`lg:col-span-2 ${panelClass}`}>
            <CardHeader className={headerClass}>
              <CardTitle className={titleClass}>
                <Clock className="w-5 h-5" />
                Rate Limit Prediction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-64 w-full">
                <ResponsiveContainer>
                  <RechartsLineChart data={data.rateLimitPredictions}>
                    <CartesianGrid vertical={false} stroke={chartGrid} />
                    <XAxis dataKey="time" tick={chartAxis} axisLine={{ stroke: "rgba(236,253,245,0.35)" }} tickLine={{ stroke: "rgba(236,253,245,0.25)" }} />
                    <YAxis tick={chartAxis} axisLine={{ stroke: "rgba(236,253,245,0.35)" }} tickLine={{ stroke: "rgba(236,253,245,0.25)" }} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="predictedHits" stroke="#ef4444" name="Predicted Hits" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Predicted Resource Usage */}
          <Card className={`lg:col-span-2 ${panelClass}`}>
            <CardHeader className={headerClass}>
              <CardTitle className={titleClass}>
                <Gauge className="w-5 h-5" />
                Predicted Resource Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.resourceUsagePredictions.map(resource => (
                <Card key={resource.resource} className={`p-4 ${nestedPanelClass}`}>
                  <h4 className="text-lg font-semibold text-white">{resource.resource}</h4>
                  <p className="text-sm text-[#00E5C0]">Predicted: {resource.predictedUsage} {resource.unit}</p>
                  <Progress value={(resource.predictedUsage / (resource.currentUsage * 2)) * 100} className={`mt-2 ${progressClass}`} />
                  <p className="text-xs text-emerald-100/60 mt-1">Current: {resource.currentUsage} {resource.unit}</p>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* User Pattern Behaviour */}
          <Card className={`lg:col-span-4 ${panelClass}`}>
            <CardHeader className={headerClass}>
              <CardTitle className={titleClass}>
                <Users className="w-5 h-5" />
                User Pattern Behaviour
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
