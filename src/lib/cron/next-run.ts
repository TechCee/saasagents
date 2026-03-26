import { CronExpressionParser } from "cron-parser";

/**
 * Next firing time strictly after `from` (UTC).
 */
export function computeNextCronRun(cronExpr: string, from: Date): Date {
  const interval = CronExpressionParser.parse(cronExpr, {
    currentDate: from,
  });
  return interval.next().toDate();
}
