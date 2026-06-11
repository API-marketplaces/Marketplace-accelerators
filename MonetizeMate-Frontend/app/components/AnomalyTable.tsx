"use client";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/app/components/ui/table";

export type Anomaly = {
  timestamp: string;
  request_count: number;
  user_id: string;
  user_count: number;
  response_time: number;
  response_code: number;
  endpoint: string;
  cpu_usage: number;
  memory_usage: number;
  rps: number;
  feature_usage: string;
  session_duration: number;
  current_usage: number;
  quota_limit: number;
  ip_address: string;
  revenue: number;
  customers: number;
  anomaly_score: number;
  type: string;
  reason: string;
};

interface AnomalyTableProps {
  anomalies: Anomaly[];
}

export function AnomalyTable({ anomalies }: AnomalyTableProps) {
  return (
    <Table className="text-white">
      <TableHeader>
        <TableRow className="border-teal-400/20 hover:bg-transparent">
          <TableHead className="text-emerald-100/80">Timestamp</TableHead>
          <TableHead className="text-emerald-100/80">Type</TableHead>
          <TableHead className="text-emerald-100/80">Reason</TableHead>
          <TableHead className="text-emerald-100/80">Request Count</TableHead>
          <TableHead className="text-emerald-100/80">Response Time</TableHead>
          <TableHead className="text-emerald-100/80">Endpoint</TableHead>
          <TableHead className="text-emerald-100/80">User ID</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {anomalies.map((anomaly, index) => (
          <TableRow key={index} className="border-teal-400/15 hover:bg-emerald-400/5">
            <TableCell className="text-white/90">{new Date(anomaly.timestamp).toLocaleString()}</TableCell>
            <TableCell className="font-semibold text-white/90">{anomaly.type}</TableCell>
            <TableCell className="text-white/90">{anomaly.reason}</TableCell>
            <TableCell className="text-white/90">{anomaly.request_count}</TableCell>
            <TableCell className="text-white/90">{anomaly.response_time}</TableCell>
            <TableCell className="font-medium text-white/90">{anomaly.endpoint}</TableCell>
            <TableCell className="font-medium text-white/90">{anomaly.user_id}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
