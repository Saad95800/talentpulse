import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home', () => {
  it('renders the welcome heading', () => {
    render(<Home />);
    
    const heading = screen.getByRole('heading', {
      name: /Bienvenue sur l'Algorithme de Matching IA/i,
    });
    
    expect(heading).toBeInTheDocument();
  });
});
