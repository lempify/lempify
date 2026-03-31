import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { mockIPC } from '@tauri-apps/api/mocks';
import { useInvoke } from './useInvoke';

describe('useInvoke', () => {
  describe('initial state', () => {
    it('starts with a null invokeStatus', () => {
      const { result } = renderHook(() => useInvoke());
      expect(result.current.invokeStatus).toBeNull();
    });
  });

  describe('successful command', () => {
    it('sets status to success and returns data', async () => {
      mockIPC(cmd => {
        if (cmd === 'get_count') return { count: 5 };
      });

      const { result } = renderHook(() => useInvoke());
      let response: Awaited<ReturnType<typeof result.current.invoke>>;

      await act(async () => {
        response = await result.current.invoke('get_count');
      });

      expect(response!.data).toEqual({ count: 5 });
      expect(response!.error).toBeUndefined();
      expect(result.current.invokeStatus).toBe('success');
    });

    it('passes args through to the command', async () => {
      mockIPC((cmd, args) => {
        if (cmd === 'add') return (args as { a: number; b: number }).a + (args as { a: number; b: number }).b;
      });

      const { result } = renderHook(() => useInvoke());
      let response: Awaited<ReturnType<typeof result.current.invoke>>;

      await act(async () => {
        response = await result.current.invoke('add', { a: 3, b: 4 });
      });

      expect(response!.data).toBe(7);
    });
  });

  describe('failed command', () => {
    it('sets status to error and returns an error string', async () => {
      mockIPC(cmd => {
        if (cmd === 'fail') throw new Error('something went wrong');
      });

      const { result } = renderHook(() => useInvoke());
      let response: Awaited<ReturnType<typeof result.current.invoke>>;

      await act(async () => {
        response = await result.current.invoke('fail');
      });

      expect(response!.error).toBe('something went wrong');
      expect(response!.data).toBeUndefined();
      expect(result.current.invokeStatus).toBe('error');
    });

    it('extracts the message from a plain string throw', async () => {
      mockIPC(cmd => {
        if (cmd === 'str_err') throw 'plain string error';
      });

      const { result } = renderHook(() => useInvoke());
      let response: Awaited<ReturnType<typeof result.current.invoke>>;

      await act(async () => {
        response = await result.current.invoke('str_err');
      });

      expect(response!.error).toBe('plain string error');
    });
  });
});
