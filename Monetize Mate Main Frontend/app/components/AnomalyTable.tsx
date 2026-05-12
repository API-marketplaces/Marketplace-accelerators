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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Timestamp</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Request Count</TableHead>
          <TableHead>Response Time</TableHead>
          <TableHead>CPU Usage</TableHead>
          <TableHead>Endpoint</TableHead>
          <TableHead>User ID</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {anomalies.map((anomaly, index) => (
          <TableRow key={index}>
            <TableCell>{new Date(anomaly.timestamp).toLocaleString()}</TableCell>
            <TableCell>{anomaly.type}</TableCell>
            <TableCell>{anomaly.reason}</TableCell>
            <TableCell>{anomaly.request_count}</TableCell>
            <TableCell>{anomaly.response_time}</TableCell>
            <TableCell>{anomaly.cpu_usage}</TableCell>
            <TableCell>{anomaly.endpoint}</TableCell>
            <TableCell>{anomaly.user_id}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
