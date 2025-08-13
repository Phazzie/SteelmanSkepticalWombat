import { useEffect } from 'react';
import { onProblemsSnapshot } from '../services/firebase';

export function useProblemsSubscription(user, currentProblem, getAIAnalysis, setProblems, setCurrentProblem, isAiLoading, analysisRequestedId, setAnalysisRequestedId) {
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = onProblemsSnapshot(user.uid, querySnapshot => {
      const fetched = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

      setProblems(fetched);
      if (currentProblem?.id) {
        const updated = fetched.find(p => p.id === currentProblem.id);
        if (updated) {
          setCurrentProblem(updated);
          if (
            updated.status === 'ai_review' &&
            !updated.ai_analysis &&
            !isAiLoading &&
            updated.id !== analysisRequestedId
          ) {
            setAnalysisRequestedId(updated.id);
            getAIAnalysis(updated);
          }
        }
      }
    });
    return unsubscribe;
  }, [user?.uid, currentProblem?.id, getAIAnalysis, setProblems, setCurrentProblem, isAiLoading, analysisRequestedId, setAnalysisRequestedId]);
}
