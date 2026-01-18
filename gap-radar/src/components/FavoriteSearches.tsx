'use client';

import { useState, useEffect } from 'react';
import { Star, Search, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getFavoriteSearches, removeFavoriteSearch, type FavoriteSearch } from '@/lib/favorites';

interface FavoriteSearchesProps {
  onSelectSearch?: (query: string) => void;
  className?: string;
}

export function FavoriteSearches({ onSelectSearch, className }: FavoriteSearchesProps) {
  const [favorites, setFavorites] = useState<FavoriteSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load favorites on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFavoriteSearches();
      setFavorites(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites');
      console.error('Error loading favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click

    try {
      setDeletingId(id);
      await removeFavoriteSearch(id);
      setFavorites(prev => prev.filter(fav => fav.id !== id));
    } catch (err) {
      console.error('Error removing favorite:', err);
      // Optionally show error notification
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectSearch = (query: string) => {
    if (onSelectSearch) {
      onSelectSearch(query);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)} data-testid="favorites-loading">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading favorites...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("p-4 text-sm text-destructive", className)} data-testid="favorites-error">
        {error}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className={cn("p-6 text-center", className)} data-testid="favorites-empty">
        <Star className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No favorite searches yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Star a search to save it for quick access
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)} data-testid="favorites-list">
      <div className="flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-primary fill-primary" />
          <span className="text-sm font-medium">Favorite Searches</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {favorites.length} {favorites.length === 1 ? 'favorite' : 'favorites'}
        </span>
      </div>

      <div className="space-y-1">
        {favorites.map((favorite) => (
          <button
            key={favorite.id}
            onClick={() => handleSelectSearch(favorite.query)}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-lg",
              "hover:bg-muted/50 transition-colors group",
              "text-left"
            )}
            data-testid="favorite-item"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm truncate">{favorite.query}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleRemoveFavorite(favorite.id, e)}
              disabled={deletingId === favorite.id}
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity",
                "h-8 w-8 p-0 flex-shrink-0"
              )}
              aria-label={`Remove ${favorite.query} from favorites`}
              data-testid="remove-favorite-button"
            >
              {deletingId === favorite.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </button>
        ))}
      </div>
    </div>
  );
}
