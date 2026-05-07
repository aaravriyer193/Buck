// =============================================================================
// Buck — budget guard
// =============================================================================
// Checked between every LLM call. Throws BUDGET_HALT to bubble up cleanly
// through the loop and into a graceful shutdown + diary entry.
// =============================================================================

import type { EventStream } from './event_stream';

export interface BudgetGuardArgs {
  sessionId: string;
  userId: string;
  sessionBudget: number;
  monthlyRemaining: number;
  currentSessionCost: number;
  stream: EventStream;
}

const SESSION_WARN_AT = 0.8;
const MONTHLY_WARN_AT = 0.9;

export async function budgetGuard(args: BudgetGuardArgs): Promise<void> {
  const sessionPct = args.currentSessionCost / Math.max(args.sessionBudget, 0.01);
  const monthlyPct = args.currentSessionCost / Math.max(args.monthlyRemaining, 0.01);

  if (sessionPct >= 1) {
    await args.stream.budgetWarning('Per-session cap reached.', {
      cost: args.currentSessionCost,
      cap: args.sessionBudget,
      kind: 'session',
    });
    throw new Error('BUDGET_HALT');
  }
  if (args.currentSessionCost >= args.monthlyRemaining) {
    await args.stream.budgetWarning('Monthly budget exhausted.', {
      cost: args.currentSessionCost,
      remaining: args.monthlyRemaining,
      kind: 'monthly',
    });
    throw new Error('BUDGET_HALT');
  }

  if (sessionPct >= SESSION_WARN_AT && sessionPct < 1) {
    await args.stream.budgetWarning(
      `Session at ${Math.round(sessionPct * 100)}% of cap.`,
      { cost: args.currentSessionCost, cap: args.sessionBudget, kind: 'session_warn' }
    );
  }
  if (monthlyPct >= MONTHLY_WARN_AT && monthlyPct < 1) {
    await args.stream.budgetWarning(
      `Approaching monthly budget cap.`,
      { cost: args.currentSessionCost, remaining: args.monthlyRemaining, kind: 'monthly_warn' }
    );
  }
}
