import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
  });

  test('basic assertion', () => {
    expect(true).toBe(true);
  });
});

// TODO: Add more comprehensive tests
// Example:
// test('renders home page', () => {
//   render(<App />);
//   const heroElement = screen.getByText(/Your Heritage Is Your Content/i);
//   expect(heroElement).toBeInTheDocument();
// });