import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

// Mock de next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock de react-redux
jest.mock('react-redux', () => ({
  useSelector: jest.fn((selector) => selector({
    user: { isLoggedIn: false }
  })),
  useDispatch: () => jest.fn(),
}));

describe('Home', () => {
  it('renders the welcome heading', () => {
    render(<Home />);
    
    const heading = screen.getByRole('heading', {
      name: /Matchez vos talents/i,
    });
    
    expect(heading).toBeInTheDocument();
  });
});
