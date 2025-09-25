import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '@/components/SearchBar';
import { useMovieAppStore } from '@/state/store';

// Mock the TMDB API search function
jest.mock('@/lib/tmdb', () => ({
  searchTmdb: jest.fn((query) => {
    if (query === 'test') {
      return Promise.resolve({
        page: 1,
        results: [
          { id: 1, title: 'Test Movie', poster_path: null, release_date: '2023-01-01', overview: '...', media_type: 'movie' },
        ],
        total_pages: 1,
        total_results: 1,
      });
    }
    return Promise.resolve({ page: 1, results: [], total_pages: 0, total_results: 0 });
  }),
  getImageUrl: jest.fn(() => '/placeholder-image.png'),
}));

describe('SearchBar', () => {
  it('renders the search input and button', () => {
    render(<SearchBar />);
    expect(screen.getByPlaceholderText('Search for movies or TV shows...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('updates the search input value', () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText('Search for movies or TV shows...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Interstellar' } });
    expect(input.value).toBe('Interstellar');
  });

  it('displays search results after a search', async () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText('Search for movies or TV shows...');
    const searchButton = screen.getByRole('button', { name: /search/i });

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(searchButton);

    expect(await screen.findByText('Test Movie')).toBeInTheDocument();
  });
});
