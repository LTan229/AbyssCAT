import { useState, useCallback } from "react";

export function useHistory<T>(initialState: T, maxHistory: number = 5) {
    const [history, setHistory] = useState<T[]>([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const setState = useCallback((newState: T) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, currentIndex + 1);
            const nextHistory = [...newHistory, newState];

            if (nextHistory.length > maxHistory) {
                return nextHistory.slice(nextHistory.length - maxHistory);
            }
            return nextHistory;
        });
        setCurrentIndex(prev => {
            const newLength = prev + 1;
            if (newLength >= maxHistory) {
                return maxHistory - 1;
            }
            return newLength;
        });
    }, [currentIndex]);

    const undo = useCallback(() => {
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : prev));
        console.log(history)
    }, []);

    const redo = useCallback(() => {
        setCurrentIndex(prev => (prev < history.length - 1 ? prev + 1 : prev));
    }, [history.length]);

    return {
        state: history[currentIndex],
        setState,
        undo,
        redo,
        canUndo: currentIndex > 0,
        canRedo: currentIndex < history.length - 1
    };
}