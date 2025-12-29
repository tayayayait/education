export type AnalysisRun = {
  id: string;
  run_type: string;
  params?: Record<string, unknown> | null;
  data_range?: Record<string, unknown> | null;
  dataset_hash?: string | null;
  created_at: string;
};

export type CttStat = {
  id: string;
  item_id: string;
  n: number;
  p_value: number | null;
  discrimination: number | null;
  point_biserial: number | null;
  mean_time_ms: number | null;
  std_time_ms: number | null;
  created_at: string;
};

export type IrtParam = {
  id: string;
  item_id: string;
  model: string;
  a_param: number | null;
  b_param: number | null;
  c_param: number | null;
  d_param: number | null;
  estimation_method: string | null;
  n: number | null;
  created_at: string;
};

export type ExposureStat = {
  id: string;
  item_id: string;
  exposure_count: number;
  mean_time_ms: number | null;
  created_at: string;
};

export type DetectionResult = {
  id: string;
  item_id: string;
  detection_type: string;
  metric_name: string;
  metric_value: number | null;
  threshold: number | null;
  status: string;
  details?: Record<string, unknown> | null;
  created_at: string;
};
