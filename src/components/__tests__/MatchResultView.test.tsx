import { render, screen } from '@testing-library/react';
import MatchResultView from '../MatchResultView';

describe('MatchResultView', () => {
  const mockResult = {
    score: 85,
    competences_validees: ['React', 'TypeScript'],
    competences_manquantes: ['GraphQL'],
    argumentaire_client: 'Le candidat a une solide expérience en frontend.',
  };

  it('renders the candidate name and score', () => {
    render(<MatchResultView result={mockResult} candidateName="Jean Dupont" />);
    
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('renders validated and missing skills', () => {
    render(<MatchResultView result={mockResult} candidateName="Jean Dupont" />);
    
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('GraphQL')).toBeInTheDocument();
  });

  it('renders the headhunter verdict', () => {
    render(<MatchResultView result={mockResult} candidateName="Jean Dupont" />);
    expect(screen.getByText(/Le candidat a une solide expérience/i)).toBeInTheDocument();
  });
});
