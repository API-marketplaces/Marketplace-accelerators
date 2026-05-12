"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { ArrowLeft, BarChart3, AlertTriangle, Users, Globe, Building, Clock, Activity, Target, CheckCircle, Calendar, UserCheck, Briefcase, Timer } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import {
  useAnalyticsOverview,
  useAnalysis,
  useTemporalAnalysis,
  useClientsAnalysis,
  useDistributionAnalysis,
  useRankingsAnalysis,
} from "@/app/hooks/useAnalytics";
import ConciergeBubble from "../../../components/ConciergeBubble";

const fmt = (val: any) => (val != null ? Number(val).toLocaleString('en-US') : '0');

export default function ApiStatsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [selectedFileId, setSelectedFileId] = useState<string>(params?.id || "");

  const [timeFilter, setTimeFilter] = useState<string>("7d");
  const [debouncedFilter, setDebouncedFilter] = useState<string>("7d");

  useEffect(() => {
    if (params.id) setSelectedFileId(params.id);
  }, [params.id]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilter(timeFilter), 400);
    return () => clearTimeout(timer);
  }, [timeFilter]);

  const { overview, isLoading: overviewLoading } = useAnalyticsOverview(selectedFileId, debouncedFilter);
  const { analysis } = useAnalysis(selectedFileId, debouncedFilter);
  const { temporalAnalysis } = useTemporalAnalysis(selectedFileId, debouncedFilter);
  const { clientsAnalysis } = useClientsAnalysis(selectedFileId, debouncedFilter);
  const { distributionAnalysis } = useDistributionAnalysis(selectedFileId, debouncedFilter);
  const { rankingsAnalysis } = useRankingsAnalysis(selectedFileId, debouncedFilter);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()} className="border-blue-300 text-blue-700 hover:bg-blue-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to File Selection
            </Button>
            <div>
              <h1 className="text-2xl text-blue-900">API Analytics Dashboard</h1>
              <p className="text-blue-700">Comprehensive insights from your API usage data</p>
            </div>
          </div>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-32 border-blue-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data Source Banner */}
        <Card className="p-4 mb-8 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-blue-900">Analysis source: <span className="font-medium">API Logs</span></p>
              <p className="text-sm text-blue-600">
                {overviewLoading ? 'Loading...' : `${fmt(overview?.total_requests)} total records`} • Time range: {timeFilter}
              </p>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="apis">API Analysis</TabsTrigger>
            <TabsTrigger value="temporal">Temporal</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-blue-200">
                <div className="flex items-center gap-3">
                  <Activity className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-blue-600 text-sm">Total Requests</p>
                    <p className="text-2xl text-blue-900">{overviewLoading ? '...' : fmt(overview?.total_requests)}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-green-600 text-sm">Successful</p>
                    <p className="text-2xl text-green-900">{overviewLoading ? '...' : fmt(overview?.successful_requests)}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-red-200">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="text-red-600 text-sm">Errors</p>
                    <p className="text-2xl text-red-900">{overviewLoading ? '...' : fmt(overview?.errors)}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-purple-200">
                <div className="flex items-center gap-3">
                  <Timer className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-purple-600 text-sm">Avg Response Time</p>
                    <p className="text-2xl text-purple-900">{overviewLoading ? '...' : `${Math.round(overview?.avg_response_time || 0)}ms`}</p>
                  </div>
                </div>
              </Card>
            </div>
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-blue-200">
              <h3 className="text-xl text-blue-900 mb-4">Daily Usage Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={overview?.daily_usage || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis dataKey="date" stroke="#3b82f6" />
                  <YAxis stroke="#3b82f6" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #3b82f6', borderRadius: '8px' }} />
                  <Legend />
                  <Line type="monotone" dataKey="total_requests" stroke="#3b82f6" strokeWidth={3} name="Requests" />
                  <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} name="Errors" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          {/* API Analysis */}
          <TabsContent value="apis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-blue-200">
                <h3 className="text-xl text-blue-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5" /> Top 5 APIs by Consumption
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analysis?.top_5_apis_by_consumption || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis dataKey="endpoint" stroke="#3b82f6" angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#3b82f6" />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #3b82f6', borderRadius: '8px' }} />
                    <Bar dataKey="total_requests" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-red-200">
                <h3 className="text-xl text-blue-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" /> APIs with Most Errors
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analysis?.apis_with_most_errors || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fef2f2" />
                    <XAxis dataKey="endpoint" stroke="#ef4444" angle={-45} textAnchor="end" height={80} />
                    <YAxis stroke="#ef4444" />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #ef4444', borderRadius: '8px' }} />
                    <Bar dataKey="error_requests" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          {/* Temporal */}
          <TabsContent value="temporal" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-blue-200">
                <h3 className="text-xl text-blue-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Daily Request Volume ({timeFilter})
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={temporalAnalysis?.daily_request_volume || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis dataKey="date" stroke="#3b82f6" />
                    <YAxis stroke="#3b82f6" />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #3b82f6', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="total_requests" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-purple-200">
                <h3 className="text-xl text-blue-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" /> Hourly Call Distribution
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={temporalAnalysis?.hourly_call_distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ff" />
                    <XAxis dataKey="hour" stroke="#8b5cf6" />
                    <YAxis stroke="#8b5cf6" />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #8b5cf6', borderRadius: '8px' }} />
                    <Bar dataKey="total_requests" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          {/* Clients */}
          <TabsContent value="clients" className="space-y-6">
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-green-200">
              <h3 className="text-xl text-blue-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" /> Top Consumers by API Calls
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={clientsAnalysis?.top_consumers || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
                  <XAxis dataKey="client_id" stroke="#10b981" angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#10b981" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #10b981', borderRadius: '8px' }} />
                  <Bar dataKey="total_requests" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          {/* Distribution */}
          <TabsContent value="distribution" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-blue-200">
                <h3 className="text-xl text-blue-900 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5" /> Geographic Distribution
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={distributionAnalysis?.geographic_distribution || []} cx="50%" cy="50%" outerRadius={80} dataKey="count"
                      label={({ geo, country, percent }: any) => `${geo || country || ''} ${((percent || 0) * 100).toFixed(0)}%`}>
                      {(distributionAnalysis?.geographic_distribution || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-orange-200">
                <h3 className="text-xl text-blue-900 mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5 text-orange-600" /> Brand Distribution
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={distributionAnalysis?.brand_distribution || []} cx="50%" cy="50%" outerRadius={80} dataKey="count"
                      label={({ brand, percent }: any) => `${brand || ''} ${((percent || 0) * 100).toFixed(0)}%`}>
                      {(distributionAnalysis?.brand_distribution || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-teal-200">
                <h3 className="text-xl text-blue-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-teal-600" /> Partner Distribution
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={distributionAnalysis?.partner_distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0fdfa" />
                    <XAxis dataKey="partner" stroke="#0d9488" />
                    <YAxis stroke="#0d9488" />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #0d9488', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="#0d9488" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-indigo-200">
                <h3 className="text-xl text-blue-900 mb-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" /> Team Distribution
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={distributionAnalysis?.team_distribution || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" />
                    <XAxis dataKey="team" stroke="#4f46e5" />
                    <YAxis stroke="#4f46e5" />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #4f46e5', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          {/* Rankings */}
          <TabsContent value="rankings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-blue-200">
                <h3 className="text-xl text-blue-900 mb-4 flex items-center gap-2"><Users className="w-5 h-5" /> Top 20 Clients</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(rankingsAnalysis?.top_20_clients || []).map((client: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{i + 1}</Badge>
                        <span className="text-sm text-blue-900">{client.client_id}</span>
                      </div>
                      <span className="text-sm text-blue-600">{fmt(client.total_requests)}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-green-200">
                <h3 className="text-xl text-blue-900 mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-green-600" /> Top 20 APIs Accessed</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(rankingsAnalysis?.top_20_apis_accessed || []).map((api: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{i + 1}</Badge>
                        <span className="text-sm text-blue-900 truncate">{api.endpoint}</span>
                      </div>
                      <span className="text-sm text-green-600">{fmt(api.total_requests)}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-red-200">
                <h3 className="text-xl text-blue-900 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-600" /> Top 20 Failed APIs</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(rankingsAnalysis?.top_20_failed_apis || []).map((api: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{i + 1}</Badge>
                        <span className="text-sm text-blue-900 truncate">{api.endpoint}</span>
                      </div>
                      <span className="text-sm text-red-600">{fmt(api.error_requests)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-8">
          <Button onClick={() => router.back()} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" /> Return to Dashboard
          </Button>
        </div>
      </div>

      {/* AI Concierge — floating bubble bottom-right */}
      <ConciergeBubble fileId={selectedFileId} />
    </div>
  );
}