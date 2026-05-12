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

export default function PredictionResultPage() {
  const router = useRouter();
  const params = useParams();
  const fileId = params.id as string;

  const [data, setData] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fileId) {
      setLoading(true);
      getPredictionData(fileId)
        .then(setData)
        .catch(err => {
          console.error("Failed to fetch prediction data", err);
          setError("Could not load prediction data for this file.");
        })
        .finally(() => setLoading(false));
    }
  }, [fileId]);

  const getSeverityBadge = (
    severity: 'High' | 'Medium' | 'Low'
  ): 'destructive' | 'secondary' | 'outline' | 'default' => {
    switch (severity) {
      case 'High':
        return 'destructive';
  
      case 'Medium':
        return 'secondary';
  
      case 'Low':
        return 'outline';
  
      default:
        return 'default';
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-8 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => router.push('/dashboard/upload')} className="border-blue-300 text-blue-700 hover:bg-blue-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Uploads
          </Button>
          <div className="flex items-center gap-4">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl text-blue-900">Prediction Analysis</h1>
              <p className="text-blue-700">Results for file ID: {fileId}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Anomalies */}
          <Card className="lg:col-span-4 bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <AlertTriangle className="w-5 h-5" />
                Detected Anomalies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnomalyTable anomalies={data.anomalies} />
            </CardContent>
          </Card>

          {/* Peak Usage */}
          <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <BarChart className="w-5 h-5" />
                Peak Usage Times
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-64 w-full">
                <ResponsiveContainer>
                  <RechartsBarChart data={data.peakUsage}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="usage" fill="var(--color-fill, #3b82f6)" radius={4} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Error Classification */}
          <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <PieChart className="w-5 h-5" />
                Error Classification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.errorClassification.map(error => (
                  <div key={error.errorType}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-blue-800">{error.errorType}</span>
                      <span className="text-sm font-medium text-blue-900">{error.percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-2.5">
                      <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${error.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Future Volume Prediction */}
          <Card className="lg:col-span-4 bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <LineChart className="w-5 h-5" />
                Future Request Volume Prediction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-80 w-full">
                <ResponsiveContainer>
                  <RechartsAreaChart data={data.futureVolume}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent indicator="line" />} />
                    <Legend />
                    <Area type="monotone" dataKey="predictedVolume" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Predicted" />
                    <Area type="monotone" dataKey="upperBound" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.1} name="Upper Bound" />
                    <Area type="monotone" dataKey="lowerBound" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.1} name="Lower Bound" />
                  </RechartsAreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Quota Limit Exceedance */}
          <Card className="lg:col-span-4 bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <ShieldAlert className="w-5 h-5" />
                Quota Limit Exceedance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Quota</TableHead>
                    <TableHead className="text-right">Exceedance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.quotaExceedances.map((item) => (
                    <TableRow key={item.userId}>
                      <TableCell>{item.userId}</TableCell>
                      <TableCell className="font-mono">{item.apiKey}</TableCell>
                      <TableCell>{item.usage.toLocaleString()}</TableCell>
                      <TableCell>{item.quota.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span>{item.exceedancePercentage}%</span>
                          <Progress value={item.exceedancePercentage} className="w-24" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Rate Limit Prediction */}
          <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Clock className="w-5 h-5" />
                Rate Limit Prediction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-64 w-full">
                <ResponsiveContainer>
                  <RechartsLineChart data={data.rateLimitPredictions}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line type="monotone" dataKey="predictedHits" stroke="#ef4444" name="Predicted Hits" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Predicted Resource Usage */}
          <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Gauge className="w-5 h-5" />
                Predicted Resource Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.resourceUsagePredictions.map(resource => (
                <Card key={resource.resource} className="p-4">
                  <h4 className="text-lg font-semibold text-blue-900">{resource.resource}</h4>
                  <p className="text-sm text-blue-600">Predicted: {resource.predictedUsage} {resource.unit}</p>
                  <Progress value={(resource.predictedUsage / (resource.currentUsage * 2)) * 100} className="mt-2" />
                  <p className="text-xs text-gray-500 mt-1">Current: {resource.currentUsage} {resource.unit}</p>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* User Pattern Behaviour */}
          <Card className="lg:col-span-4 bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Users className="w-5 h-5" />
                User Pattern Behaviour
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.userPatterns.map(pattern => (
                <Card key={pattern.userSegment} className="p-4 bg-blue-50/50">
                  <h4 className="font-semibold text-blue-900">{pattern.userSegment}</h4>
                  <p className="text-sm text-blue-700 mt-1">{pattern.description}</p>
                  <div className="mt-3">
                    <p className="text-xs text-blue-600">Avg. Daily Requests: <span className="font-bold">{pattern.avgRequestsPerDay.toLocaleString()}</span></p>
                    <p className="text-xs text-blue-600">Peak Time: <span className="font-bold">{pattern.peakTime}</span></p>
                  </div>
                </Card>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>
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
