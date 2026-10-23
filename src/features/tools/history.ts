/**
 * Tool history is owned by the shared demo store (`state.toolHistory`), so a
 * demo reset clears it with everything else. This module only adapts that state
 * for the tools screens — no local store, no listeners.
 */
import { useCallback } from 'react';
import { useDemoState, useDemoActions } from '../../demo';
import type { ToolHistoryEntry, ToolKind } from '../../demo';
import type { StringKey } from '../../locales';

export function useToolHistory(): ToolHistoryEntry[] {
  return useDemoState().toolHistory;
}

/** Returns a stable recorder that writes through `actions.recordToolUse`. */
export function useToolRecorder() {
  const { recordToolUse } = useDemoActions();
  return useCallback(
    (tool: ToolKind, labelKey: StringKey, summary: string) => recordToolUse(tool, labelKey, summary),
    [recordToolUse],
  );
}
