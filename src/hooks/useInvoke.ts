import { useCallback, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { InvokeStatus } from "../types";

/** Generic hook for invoking Tauri commands with consistent error handling */
export function useInvoke() {
  const [invokeStatus, setInvokeStatus] = useState<InvokeStatus>(null);
  const safeInvoke = useCallback(
    async <T = unknown>(
      command: string,
      args?: Record<string, unknown>
    ): Promise<{ data?: T; error?: string }> => {
      setInvokeStatus('pending');
      try {
        const data = await invoke<T>(command, args);
        setInvokeStatus('success');
        return { data };
      } catch (error: any) {
        console.error(`❌ invoke(${command}) failed`, error);
        setInvokeStatus('error');
        return { error: error?.message || "Unknown error" };
      }
    },
    []
  );

  return { invoke: safeInvoke, invokeStatus };
}
