import { createClient } from "@supabase/supabase-js";

type FDRateRow = {
  bank_name: string;
  tenor_months: number;
  gross_rate: number;
  is_active?: boolean;
};

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cronSecret = process.env.CRON_SECRET;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase service credentials for cron update");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

export default async function handler(req: any, res: any) {
  if (
    cronSecret &&
    req.query.secret !== cronSecret &&
    req.headers["x-cron-secret"] !== cronSecret
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { data: activeRates, error: ratesError } = await supabase
      .from("fd_rates")
      .select("bank_name, tenor_months, gross_rate, is_active")
      .eq("is_active", true);

    if (ratesError) {
      throw ratesError;
    }

    const { data: latestHistory, error: historyError } = await supabase
      .from("fd_rate_history")
      .select("bank_name, tenor_days, gross_rate, effective_date")
      .order("created_at", { ascending: false })
      .limit(200);

    if (historyError) {
      throw historyError;
    }

    const latestByKey = new Map<string, number>();
    (latestHistory || []).forEach((row) => {
      const key = `${row.bank_name}-${row.tenor_days}`;
      if (!latestByKey.has(key)) {
        latestByKey.set(key, Number(row.gross_rate));
      }
    });

    const rowsToInsert = (activeRates || []).flatMap((row: FDRateRow) => {
      const tenorDays = row.tenor_months * 30;
      const key = `${row.bank_name}-${tenorDays}`;
      const previous = latestByKey.get(key);
      const current = Number(row.gross_rate);
      if (previous !== undefined && previous === current) {
        return [];
      }

      return [
        {
          bank_name: row.bank_name,
          tenor_days: tenorDays,
          gross_rate: current,
          previous_gross_rate: previous ?? null,
          delta_rate:
            previous === undefined
              ? 0
              : Number((current - previous).toFixed(2)),
          effective_date: new Date().toISOString().split("T")[0],
          source_label: "Vercel cron",
        },
      ];
    });

    if (rowsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("fd_rate_history")
        .insert(rowsToInsert);

      if (insertError) {
        throw insertError;
      }
    }

    return res.status(200).json({
      ok: true,
      inserted: rowsToInsert.length,
      checked: activeRates?.length || 0,
    });
  } catch (error: any) {
    console.error("FD rate cron failed:", error);
    return res
      .status(500)
      .json({ error: error?.message || "Failed to update FD rates" });
  }
}
