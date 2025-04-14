import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

/** Generic hook for invoking Tauri commands with consistent error handling */
export function useInvoke() {
  const safeInvoke = useCallback(
    async <T = unknown>(
      command: string,
      args?: Record<string, unknown>
    ): Promise<{ data?: T; error?: string }> => {
      try {
        const data = await invoke<T>(command, args);
        return { data };
      } catch (error: any) {
        console.error(`❌ invoke(${command}) failed`, error);
        return { error: error?.message || "Unknown error" };
      }
    },
    []
  );

  return { invoke: safeInvoke };
}
