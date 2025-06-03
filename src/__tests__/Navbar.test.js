import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '../components/Navbar';
import { signOut } from 'firebase/auth';

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signOut: jest.fn(() => Promise.resolve())
}));

describe('Navbar Logout', () => {
  it('renders logout button', () => {
    render(<Navbar />);
    expect(screen.getByText(/logout/i)).toBeInTheDocument();
  });

  it('calls signOut when logout is clicked', async () => {
    render(<Navbar />);
    fireEvent.click(screen.getByText(/logout/i));
    expect(signOut).toHaveBeenCalled();
  });
});
