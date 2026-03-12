import { DashboardClient } from "@/app/(app)/dashboard/DashboardClient";
import { format, startOfMonth } from "date-fns";
import { fetchDashboardOverview } from "@/lib/services/dashboardOverview.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isoDate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export default async function DashboardPage({
  searchParams,
}: {
  // Next.js 16+ provides searchParams as a Promise in Server Components.
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const now = new Date();
  const defaultStartDate = isoDate(startOfMonth(now));
  const defaultEndDate = isoDate(now);

  const startDate =
    typeof resolvedSearchParams?.startDate === "string"
      ? resolvedSearchParams.startDate
      : defaultStartDate;
  const endDate =
    typeof resolvedSearchParams?.endDate === "string"
      ? resolvedSearchParams.endDate
      : defaultEndDate;

  const filters = { startDate, endDate };
  const overview = await fetchDashboardOverview(filters);

  return (
    <DashboardClient
      summary={overview.summary}
      previousSummary={overview.previousSummary}
      growth={overview.growth}
      trends={overview.trends}
      startDate={startDate}
      endDate={endDate}
      previousStartDate={overview.previousRange.startDate}
      previousEndDate={overview.previousRange.endDate}
    />
  );
}
