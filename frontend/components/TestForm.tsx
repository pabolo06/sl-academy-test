/**
 * SL Academy Platform - Test Form Component
 * Multiple choice test form with validation
 */

'use client';

import { useState } from 'react';
import { Question, TestAttemptAnswer } from '@/types';

interface TestFormProps {
  questions: Question[];
  onSubmit: (answers: TestAttemptAnswer[]) => Promise<void>;
  testType: 'pre' | 'post';
}

export function TestForm({ questions, onSubmit, testType }: TestFormProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswerChange = (questionId: string, optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex,
    }));
    // Clear errors when user selects an answer
    setErrors([]);
  };

  const validateAnswers = (): boolean => {
    const unanswered: string[] = [];
    
    questions.forEach((question, index) => {
      if (answers[question.id] === undefined) {
        unanswered.push(`Questão ${index + 1}`);
      }
    });

    if (unanswered.length > 0) {
      setErrors([`Por favor, responda todas as questões: ${unanswered.join(', ')}`]);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAnswers()) {
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      const formattedAnswers: TestAttemptAnswer[] = Object.entries(answers).map(
        ([question_id, selected_option_index]) => ({
          question_id,
          selected_option_index,
        })
      );

      await onSubmit(formattedAnswers);
    } catch (err: any) {
      setErrors([err.message || 'Erro ao enviar respostas']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <p className="text-blue-200 text-sm">
          {testType === 'pre' ? '📝 Pré-teste' : '✅ Pós-teste'} - {questions.length} questões
        </p>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
          {errors.map((error, index) => (
            <p key={index} className="text-red-200 text-sm">{error}</p>
          ))}
        </div>
      )}

      <div className="space-y-8">
        {questions.map((question, qIndex) => (
          <div
            key={question.id}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <h3 className="text-lg font-medium text-white mb-4">
              {qIndex + 1}. {question.question_text}
            </h3>

            <div className="space-y-3">
              {question.options.map((option, oIndex) => {
                const isSelected = answers[question.id] === oIndex;
                
                return (
                  <label
                    key={oIndex}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-gray-600 hover:border-gray-500 bg-gray-900/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question_${question.id}`}
                      value={oIndex}
                      checked={isSelected}
                      onChange={() => handleAnswerChange(question.id, oIndex)}
                      className="mt-1 w-4 h-4 text-blue-600"
                    />
                    <span className="text-gray-300 flex-1">{option}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-gray-400">
          {Object.keys(answers).length} de {questions.length} questões respondidas
        </p>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Respostas'}
        </button>
      </div>
    </form>
  );
}
