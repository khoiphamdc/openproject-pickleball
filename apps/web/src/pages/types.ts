import type { MockMeta } from '../services/mockData';
import type { ScoreRunResult, TaskInput } from '../services/scoring';

export interface PageProps {
  tasks: TaskInput[];
  run: ScoreRunResult;
  meta: MockMeta;
  onGoToPage?: (page: string) => void;
}
