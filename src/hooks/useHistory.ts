import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function useHistory() {

  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(
    window.history.state.idx
  );
  const [historyLength, setHistoryLength] = useState(window.history.length);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setHistoryLength(window.history.length);
    setCurrentHistoryIndex(window.history.state.idx);
  }, [window.history.length, location.pathname]);

  return {
    canGoBack: currentHistoryIndex > 0,
    canGoForward: currentHistoryIndex < historyLength - 1,
    goBack: () => {
      navigate(-1);
    },
    goForward: () => {
      navigate(1);
    },
  };
}
