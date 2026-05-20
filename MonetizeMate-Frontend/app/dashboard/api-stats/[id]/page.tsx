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

const fmt = (val: unknown) => (val != null ? Number(val).toLocaleString("en-US") : "0");

// ── Dark-theme chart colours ────────────────────────────────────────────────
const C = {
  accent:   "#00E5C0",   // teal accent
  accentDim:"#1ABFA3",
  blue:     "#3b82f6",
  red:      "#ef4444",
  purple:   "#a78bfa",
  orange:   "#fb923c",
  yellow:   "#fbbf24",
  green:    "#34d399",
  grid:     "rgba(255,255,255,0.07)",
  axis:     "rgba(255,255,255,0.45)",
  tooltip:  { backgroundColor: "#0D2035", border: "1px solid rgba(0,229,192,0.35)", borderRadius: "8px", color: "#fff" },
};
const PIE_COLORS = [C.accent, C.blue, C.purple, C.orange, C.yellow, C.green, "#f472b6", "#38bdf8"];

// ── Shared card style ───────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: `
    linear-gradient(135deg, rgba(20, 184, 166, 0.18), rgba(15, 23, 42, 0.9) 48%, rgba(22, 163, 74, 0.12)),
    linear-gradient(rgba(45, 212, 191, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(45, 212, 191, 0.07) 1px, transparent 1px)
  `,
  backgroundSize: "auto, 118px 118px, 118px 118px",
  border: "1px solid rgba(45, 212, 191, 0.2)",
  borderRadius: 12,
  boxShadow: "0 18px 45px rgba(0, 229, 192, 0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
};

const distributionCardStyle: React.CSSProperties = {
  ...cardStyle,
  minHeight: 360,
  padding: "24px",
};

const EmptyChart = ({ message = "No distribution data available" }: { message?: string }) => (
  <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-teal-300/20 bg-emerald-400/5 text-sm text-white/45">
    {message}
  </div>
);

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : "Unknown error.";

const ErrorBanner = ({ error }: { error: unknown }) =>
  error ? (
    <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 8 }}
         className="flex items-center gap-2 p-3 mb-4 text-sm text-red-400">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>Failed to load data: {getErrorMessage(error)}</span>
    </div>
  ) : null;

type GeographicPieLabel = { geo?: string; name?: string; percent?: number };
type BrandPieLabel = { brand?: string; name?: string; percent?: number };
type RankedClient = { client_id: string; total_requests: number };
type RankedApi = { endpoint: string; total_requests: number };
type FailedApi = { endpoint: string; error_requests: number };

export default function ApiStatsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const selectedFileId = params?.id || "";
  const [timeFilter, setTimeFilter] = useState<string>("7d");
  const [debouncedFilter, setDebouncedFilter] = useState<string>("7d");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilter(timeFilter), 400);
    return () => clearTimeout(t);
  }, [timeFilter]);

  const { overview, isLoading: overviewLoading, isError: overviewError }       = useAnalyticsOverview(selectedFileId, debouncedFilter);
  const { analysis,          isError: analysisError }                           = useAnalysis(selectedFileId, debouncedFilter);
  const { temporalAnalysis,  isError: temporalError }                           = useTemporalAnalysis(selectedFileId, debouncedFilter);
  const { clientsAnalysis,   isError: clientsError }                            = useClientsAnalysis(selectedFileId, debouncedFilter);
  const { distributionAnalysis, isError: distributionError }                    = useDistributionAnalysis(selectedFileId, debouncedFilter);
  const { rankingsAnalysis,  isError: rankingsError }                           = useRankingsAnalysis(selectedFileId, debouncedFilter);

  // ── Stat cards ─────────────────────────────────────────────────────────────
  const statCards = [
    { label: "Total Requests",    value: fmt(overview?.total_requests),                     icon: <Activity className="w-7 h-7" />, color: C.accent  },
    { label: "Successful",        value: fmt(overview?.successful_requests),                icon: <CheckCircle className="w-7 h-7" />, color: C.green   },
    { label: "Errors",            value: fmt(overview?.errors),                             icon: <AlertTriangle className="w-7 h-7" />, color: C.red     },
    { label: "Avg Response Time", value: `${Math.round(overview?.avg_response_time || 0)}ms`, icon: <Timer className="w-7 h-7" />, color: C.purple  },
  ];

  return (
    <div className="min-h-screen p-6 md:p-8" style={{ background: "transparent" }}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              style={{ background: "rgba(0,229,192,0.1)", border: "1px solid rgba(0,229,192,0.35)", color: C.accent, borderRadius: 8, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}
            >
              <ArrowLeft className="w-4 h-4" /> Back to File Selection
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-white">API Analytics Dashboard</h1>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Comprehensive insights from your API usage data</p>
            </div>
          </div>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger style={{ width: 140, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(0,229,192,0.25)", color: "#fff" }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent style={{ background: "#0A1628", border: "1px solid rgba(0,229,192,0.25)", color: "#fff" }}>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── Source banner ── */}
        <div style={{ ...cardStyle, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <BarChart3 style={{ color: C.accent, width: 20, height: 20, flexShrink: 0 }} />
          <div>
            <p className="text-white text-sm">Analysis source: <span style={{ color: C.accent }}>API Logs</span></p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
              {overviewLoading ? "Loading…" : `${fmt(overview?.total_requests)} total records`} • Time range: {timeFilter}
            </p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,229,192,0.12)", borderRadius: 10, padding: 4, display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 2 }}>
            {["overview","apis","temporal","clients","distribution","rankings"].map(v => (
              <TabsTrigger key={v} value={v} style={{ borderRadius: 7, fontSize: 13, color: "rgba(255,255,255,0.6)", textTransform: "capitalize" }}>
                {v === "apis" ? "API Analysis" : v.charAt(0).toUpperCase() + v.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ══ OVERVIEW ══ */}
          <TabsContent value="overview" className="space-y-6">
            <ErrorBanner error={overviewError} />

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {statCards.map(({ label, value, icon, color }) => (
                <div key={label} style={{ ...cardStyle, padding: "20px 24px" }}>
                  <div style={{ color, marginBottom: 8 }}>{icon}</div>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 4 }}>{label}</p>
                  <p style={{ color: "#fff", fontSize: 22, fontWeight: 600 }}>{overviewLoading ? "…" : value}</p>
                </div>
              ))}
            </div>

            {/* Daily Usage Trend chart */}
            <div style={{ ...cardStyle, padding: "24px" }}>
              <p className="text-white font-medium mb-6" style={{ fontSize: 16 }}>Daily Usage Trend</p>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={overview?.daily_usage || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                  <XAxis dataKey="date" stroke={C.axis} tick={{ fill: C.axis, fontSize: 12 }} />
                  <YAxis stroke={C.axis} tick={{ fill: C.axis, fontSize: 12 }} />
                  <Tooltip contentStyle={C.tooltip} labelStyle={{ color: C.accent }} />
                  <Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }} />
                  <Line type="monotone" dataKey="total_requests" stroke={C.accent} strokeWidth={2.5} dot={false} name="Requests" />
                  <Line type="monotone" dataKey="errors" stroke={C.red} strokeWidth={2} dot={false} name="Errors" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* ══ API ANALYSIS ══ */}
          <TabsContent value="apis" className="space-y-6">
            <ErrorBanner error={analysisError} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div style={{ ...cardStyle, padding: "24px" }}>
                <p className="text-white font-medium mb-5 flex items-center gap-2" style={{ fontSize: 15 }}>
                  <Target style={{ color: C.accent, width: 18, height: 18 }} /> Top 5 APIs by Consumption
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={analysis?.top_5_apis_by_consumption || []} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                    <XAxis dataKey="endpoint" stroke={C.axis} tick={{ fill: C.axis, fontSize: 11 }} angle={-40} textAnchor="end" interval={0} />
                    <YAxis stroke={C.axis} tick={{ fill: C.axis, fontSize: 11 }} />
                    <Tooltip contentStyle={C.tooltip} />
                    <Bar dataKey="total_requests" fill={C.accent} radius={[4, 4, 0, 0]} name="Requests" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ ...cardStyle, padding: "24px" }}>
                <p className="text-white font-medium mb-5 flex items-center gap-2" style={{ fontSize: 15 }}>
                  <AlertTriangle style={{ color: C.red, width: 18, height: 18 }} /> APIs with Most Errors
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={analysis?.apis_with_most_errors || []} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                    <XAxis dataKey="endpoint" stroke={C.axis} tick={{ fill: C.axis, fontSize: 11 }} angle={-40} textAnchor="end" interval={0} />
                    <YAxis stroke={C.axis} tick={{ fill: C.axis, fontSize: 11 }} />
                    <Tooltip contentStyle={C.tooltip} />
                    <Bar dataKey="error_requests" fill={C.red} radius={[4, 4, 0, 0]} name="Errors" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          {/* ══ TEMPORAL ══ */}
          <TabsContent value="temporal" className="space-y-6">
            <ErrorBanner error={temporalError} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div style={{ ...cardStyle, padding: "24px" }}>
                <p className="text-white font-medium mb-5 flex items-center gap-2" style={{ fontSize: 15 }}>
                  <Calendar style={{ color: C.accent, width: 18, height: 18 }} /> Daily Request Volume ({timeFilter})
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={temporalAnalysis?.daily_request_volume || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.accent} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={C.accent} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                    <XAxis dataKey="date" stroke={C.axis} tick={{ fill: C.axis, fontSize: 11 }} />
                    <YAxis stroke={C.axis} tick={{ fill: C.axis, fontSize: 11 }} />
                    <Tooltip contentStyle={C.tooltip} />
                    <Area type="monotone" dataKey="total_requests" stroke={C.accent} fill="url(#areaGrad)" strokeWidth={2} name="Requests" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ ...cardStyle, padding: "24px" }}>
                <p className="text-white font-medium mb-5 flex items-center gap-2" style={{ fontSize: 15 }}>
                  <Clock style={{ color: C.purple, width: 18, height: 18 }} /> Hourly Call Distribution
                </p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={temporalAnalysis?.hourly_call_distribution || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                    <XAxis dataKey="hour" stroke={C.axis} tick={{ fill: C.axis, fontSize: 11 }} />
                    <YAxis stroke={C.axis} tick={{ fill: C.axis, fontSize: 11 }} />
                    <Tooltip contentStyle={C.tooltip} />
                    <Bar dataKey="total_requests" fill={C.purple} radius={[4, 4, 0, 0]} name="Requests" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          {/* ══ CLIENTS ══ */}
          <TabsContent value="clients" className="space-y-6">
            <ErrorBanner error={clientsError} />
            <div style={{ ...cardStyle, padding: "24px" }}>
              <p className="text-white font-medium mb-5 flex items-center gap-2" style={{ fontSize: 15 }}>
                <Users style={{ color: C.green, width: 18, height: 18 }} /> Top Consumers by API Calls
              </p>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={clientsAnalysis?.top_consumers || []} margin={{ top: 5, right: 10, left: 0, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                  <XAxis dataKey="client_id" stroke={C.axis} tick={{ fill: C.axis, fontSize: 11 }} angle={-45} textAnchor="end" interval={0} />
                  <YAxis stroke={C.axis} tick={{ fill: C.axis, fontSize: 11 }} />
                  <Tooltip contentStyle={C.tooltip} />
                  <Bar dataKey="total_requests" fill={C.green} radius={[4, 4, 0, 0]} name="Requests" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* ══ DISTRIBUTION ══ */}
          <TabsContent value="distribution" className="space-y-6">
            <ErrorBanner error={distributionError} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Geographic */}
              <div style={distributionCardStyle}>
                <p className="text-white font-medium mb-5 flex items-center gap-2" style={{ fontSize: 15 }}>
                  <Globe style={{ color: C.accent, width: 18, height: 18 }} /> Geographic Distribution
                </p>
                {(distributionAnalysis?.geographic_distribution?.length || 0) > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={distributionAnalysis?.geographic_distribution || []} cx="50%" cy="50%" outerRadius={90} dataKey="count" nameKey="geo"
                        label={({ geo, name, percent }: GeographicPieLabel) => `${geo || name || ""} ${((percent || 0) * 100).toFixed(0)}%`}
                        labelLine={{ stroke: "rgba(255,255,255,0.25)" }}>
                        {(distributionAnalysis?.geographic_distribution || []).map((_, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={C.tooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <EmptyChart message="No geographic data available" />}
              </div>

              {/* Brand */}
              <div style={distributionCardStyle}>
                <p className="text-white font-medium mb-5 flex items-center gap-2" style={{ fontSize: 15 }}>
                  <Building style={{ color: C.orange, width: 18, height: 18 }} /> Brand Distribution
                </p>
                {(distributionAnalysis?.brand_distribution?.length || 0) > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={distributionAnalysis?.brand_distribution || []} cx="50%" cy="50%" outerRadius={90} dataKey="count" nameKey="brand"
                        label={({ brand, name, percent }: BrandPieLabel) => `${brand || name || ""} ${((percent || 0) * 100).toFixed(0)}%`}
                        labelLine={{ stroke: "rgba(255,255,255,0.25)" }}>
                        {(distributionAnalysis?.brand_distribution || []).map((_, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={C.tooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <EmptyChart message="No brand data available" />}
              </div>

              {/* Partner */}
              <div style={distributionCardStyle}>
                <p className="text-white font-medium mb-5 flex items-center gap-2" style={{ fontSize: 15 }}>
                  <Briefcase style={{ color: C.accentDim, width: 18, height: 18 }} /> Partner Distribution
                </p>
                {(distributionAnalysis?.partner_distribution?.length || 0) > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={distributionAnalysis?.partner_distribution || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                      <XAxis dataKey="partner" stroke={C.axis} tick={{ fill: C.axis, fontSize: 11 }} />
                      <YAxis stroke={C.axis} tick={{ fill: C.axis, fontSize: 11 }} />
                      <Tooltip contentStyle={C.tooltip} />
                      <Bar dataKey="count" fill={C.accentDim} radius={[4, 4, 0, 0]} name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyChart message="No partner data available" />}
              </div>

              {/* Team */}
              <div style={distributionCardStyle}>
                <p className="text-white font-medium mb-5 flex items-center gap-2" style={{ fontSize: 15 }}>
                  <UserCheck style={{ color: C.blue, width: 18, height: 18 }} /> Team Distribution
                </p>
                {(distributionAnalysis?.team_distribution?.length || 0) > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={distributionAnalysis?.team_distribution || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                      <XAxis dataKey="team" stroke={C.axis} tick={{ fill: C.axis, fontSize: 11 }} />
                      <YAxis stroke={C.axis} tick={{ fill: C.axis, fontSize: 11 }} />
                      <Tooltip contentStyle={C.tooltip} />
                      <Bar dataKey="count" fill={C.blue} radius={[4, 4, 0, 0]} name="Count" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyChart message="No team data available" />}
              </div>
            </div>
          </TabsContent>

          {/* ══ RANKINGS ══ */}
          <TabsContent value="rankings" className="space-y-6">
            <ErrorBanner error={rankingsError} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Top 20 Clients */}
              <div style={{ ...cardStyle, padding: "24px" }}>
                <p className="text-white font-medium mb-4 flex items-center gap-2" style={{ fontSize: 15 }}>
                  <Users style={{ color: C.accent, width: 18, height: 18 }} /> Top 20 Clients
                </p>
                <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 400 }}>
                  {(rankingsAnalysis?.top_20_clients || []).map((c: RankedClient, i: number) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,229,192,0.06)", borderRadius: 6, padding: "7px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ background: "rgba(0,229,192,0.15)", color: C.accent, borderRadius: 4, padding: "1px 7px", fontSize: 11, fontWeight: 600 }}>{i + 1}</span>
                        <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{c.client_id}</span>
                      </div>
                      <span style={{ color: C.accent, fontSize: 13, fontWeight: 500 }}>{fmt(c.total_requests)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 20 APIs Accessed */}
              <div style={{ ...cardStyle, padding: "24px" }}>
                <p className="text-white font-medium mb-4 flex items-center gap-2" style={{ fontSize: 15 }}>
                  <Target style={{ color: C.green, width: 18, height: 18 }} /> Top 20 APIs Accessed
                </p>
                <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 400 }}>
                  {(rankingsAnalysis?.top_20_apis_accessed || []).map((a: RankedApi, i: number) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(52,211,153,0.07)", borderRadius: 6, padding: "7px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                        <span style={{ background: "rgba(52,211,153,0.15)", color: C.green, borderRadius: 4, padding: "1px 7px", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.endpoint}</span>
                      </div>
                      <span style={{ color: C.green, fontSize: 13, fontWeight: 500, flexShrink: 0, marginLeft: 8 }}>{fmt(a.total_requests)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 20 Failed APIs */}
              <div style={{ ...cardStyle, padding: "24px" }}>
                <p className="text-white font-medium mb-4 flex items-center gap-2" style={{ fontSize: 15 }}>
                  <AlertTriangle style={{ color: C.red, width: 18, height: 18 }} /> Top 20 Failed APIs
                </p>
                <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 400 }}>
                  {(rankingsAnalysis?.top_20_failed_apis || []).map((a: FailedApi, i: number) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(239,68,68,0.07)", borderRadius: 6, padding: "7px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                        <span style={{ background: "rgba(239,68,68,0.15)", color: C.red, borderRadius: 4, padding: "1px 7px", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.endpoint}</span>
                      </div>
                      <span style={{ color: C.red, fontSize: 13, fontWeight: 500, flexShrink: 0, marginLeft: 8 }}>{fmt(a.error_requests)}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center pt-2 pb-4">
          <button
            onClick={() => router.back()}
            style={{ background: "linear-gradient(135deg, #00E5C0, #1ABFA3)", color: "#060E1E", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8, border: "none", cursor: "pointer" }}
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </button>
        </div>
      </div>

      <ConciergeBubble fileId={selectedFileId} />
    </div>
  );
}
