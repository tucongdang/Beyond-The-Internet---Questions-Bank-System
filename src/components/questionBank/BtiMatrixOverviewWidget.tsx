import React from 'react';
import { QuestionItem } from '../../types';
import { KnowledgeAreaDifficultyWidget } from './KnowledgeAreaDifficultyWidget';

interface BtiMatrixOverviewWidgetProps {
  questions: QuestionItem[];
  onOpenFullMatrix: () => void;
}

export const BtiMatrixOverviewWidget: React.FC<BtiMatrixOverviewWidgetProps> = ({
  questions,
  onOpenFullMatrix
}) => {
  return (
    <KnowledgeAreaDifficultyWidget
      questions={questions}
      onOpenFullMatrix={onOpenFullMatrix}
    />
  );
};
