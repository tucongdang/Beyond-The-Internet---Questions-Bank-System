import { useState, useCallback, useRef, useEffect } from 'react';

export function useUndoRedo<T>(initialState: T, debounceMs: number = 500) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [index, setIndex] = useState<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUndoRedoAction = useRef(false);

  const pushState = useCallback((newState: T) => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setHistory(prev => {
        // If the new state is exactly the same as the current, don't push
        if (JSON.stringify(prev[index]) === JSON.stringify(newState)) return prev;
        
        const newHistory = prev.slice(0, index + 1);
        newHistory.push(newState);
        // keep last 50
        if (newHistory.length > 50) newHistory.shift();
        setIndex(newHistory.length - 1);
        return newHistory;
      });
    }, debounceMs);
  }, [index, debounceMs]);

  const undo = useCallback(() => {
    if (index > 0) {
      isUndoRedoAction.current = true;
      setIndex(prev => prev - 1);
      return history[index - 1];
    }
    return null;
  }, [index, history]);

  const redo = useCallback(() => {
    if (index < history.length - 1) {
      isUndoRedoAction.current = true;
      setIndex(prev => prev + 1);
      return history[index + 1];
    }
    return null;
  }, [index, history]);

  return {
    canUndo: index > 0,
    canRedo: index < history.length - 1,
    undo,
    redo,
    pushState,
    historyLength: history.length
  };
}
