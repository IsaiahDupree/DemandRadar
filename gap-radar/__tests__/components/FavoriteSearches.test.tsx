import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FavoriteSearches } from '@/components/FavoriteSearches';
import * as favoritesLib from '@/lib/favorites';

// Mock the favorites library
jest.mock('@/lib/favorites', () => ({
  getFavoriteSearches: jest.fn(),
  removeFavoriteSearch: jest.fn(),
}));

describe('FavoriteSearches Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state initially', () => {
    (favoritesLib.getFavoriteSearches as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<FavoriteSearches />);

    expect(screen.getByTestId('favorites-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading favorites...')).toBeInTheDocument();
  });

  it('should display empty state when no favorites exist', async () => {
    (favoritesLib.getFavoriteSearches as jest.Mock).mockResolvedValue([]);

    render(<FavoriteSearches />);

    await waitFor(() => {
      expect(screen.getByTestId('favorites-empty')).toBeInTheDocument();
    });

    expect(screen.getByText('No favorite searches yet')).toBeInTheDocument();
    expect(screen.getByText('Star a search to save it for quick access')).toBeInTheDocument();
  });

  it('should display list of favorites', async () => {
    const mockFavorites = [
      {
        id: 'fav-1',
        user_id: 'user-123',
        query: 'AI tools for content creators',
        created_at: '2026-01-18T00:00:00.000Z',
      },
      {
        id: 'fav-2',
        user_id: 'user-123',
        query: 'SaaS alternatives',
        created_at: '2026-01-18T00:01:00.000Z',
      },
    ];

    (favoritesLib.getFavoriteSearches as jest.Mock).mockResolvedValue(mockFavorites);

    render(<FavoriteSearches />);

    await waitFor(() => {
      expect(screen.getByTestId('favorites-list')).toBeInTheDocument();
    });

    expect(screen.getByText('AI tools for content creators')).toBeInTheDocument();
    expect(screen.getByText('SaaS alternatives')).toBeInTheDocument();
    expect(screen.getByText('2 favorites')).toBeInTheDocument();
  });

  it('should call onSelectSearch when favorite is clicked', async () => {
    const mockFavorites = [
      {
        id: 'fav-1',
        user_id: 'user-123',
        query: 'AI tools for content creators',
        created_at: '2026-01-18T00:00:00.000Z',
      },
    ];

    (favoritesLib.getFavoriteSearches as jest.Mock).mockResolvedValue(mockFavorites);
    const onSelectSearch = jest.fn();

    render(<FavoriteSearches onSelectSearch={onSelectSearch} />);

    await waitFor(() => {
      expect(screen.getByText('AI tools for content creators')).toBeInTheDocument();
    });

    const favoriteItem = screen.getAllByTestId('favorite-item')[0];
    fireEvent.click(favoriteItem);

    expect(onSelectSearch).toHaveBeenCalledWith('AI tools for content creators');
  });

  it('should remove favorite when delete button is clicked', async () => {
    const mockFavorites = [
      {
        id: 'fav-1',
        user_id: 'user-123',
        query: 'AI tools for content creators',
        created_at: '2026-01-18T00:00:00.000Z',
      },
      {
        id: 'fav-2',
        user_id: 'user-123',
        query: 'SaaS alternatives',
        created_at: '2026-01-18T00:01:00.000Z',
      },
    ];

    (favoritesLib.getFavoriteSearches as jest.Mock).mockResolvedValue(mockFavorites);
    (favoritesLib.removeFavoriteSearch as jest.Mock).mockResolvedValue(undefined);

    render(<FavoriteSearches />);

    await waitFor(() => {
      expect(screen.getByText('AI tools for content creators')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTestId('remove-favorite-button');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(favoritesLib.removeFavoriteSearch).toHaveBeenCalledWith('fav-1');
    });

    // Favorite should be removed from the list
    await waitFor(() => {
      expect(screen.queryByText('AI tools for content creators')).not.toBeInTheDocument();
    });

    // Second favorite should still be there
    expect(screen.getByText('SaaS alternatives')).toBeInTheDocument();
    expect(screen.getByText('1 favorite')).toBeInTheDocument();
  });

  it('should show error state when loading fails', async () => {
    (favoritesLib.getFavoriteSearches as jest.Mock).mockRejectedValue(
      new Error('Database connection failed')
    );

    render(<FavoriteSearches />);

    await waitFor(() => {
      expect(screen.getByTestId('favorites-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Database connection failed')).toBeInTheDocument();
  });

  it('should show singular favorite text when only one favorite exists', async () => {
    const mockFavorites = [
      {
        id: 'fav-1',
        user_id: 'user-123',
        query: 'AI tools',
        created_at: '2026-01-18T00:00:00.000Z',
      },
    ];

    (favoritesLib.getFavoriteSearches as jest.Mock).mockResolvedValue(mockFavorites);

    render(<FavoriteSearches />);

    await waitFor(() => {
      expect(screen.getByText('1 favorite')).toBeInTheDocument();
    });
  });
});
