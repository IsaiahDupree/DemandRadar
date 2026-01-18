/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import VideoPlayer from '@/components/VideoPlayer';

describe('VideoPlayer Component', () => {
  const mockVideo = {
    id: 'video-1',
    title: 'Getting Started Tutorial',
    description: 'Learn how to use GapRadar',
    embedUrl: 'https://www.youtube.com/embed/test123',
    duration: '5:23',
  };

  describe('Video Rendering', () => {
    it('should render video player with iframe', () => {
      render(<VideoPlayer video={mockVideo} />);

      const iframe = screen.getByTitle(mockVideo.title);
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute('src', mockVideo.embedUrl);
    });

    it('should display video title', () => {
      render(<VideoPlayer video={mockVideo} />);

      expect(screen.getByText(mockVideo.title)).toBeInTheDocument();
    });

    it('should display video description', () => {
      render(<VideoPlayer video={mockVideo} />);

      expect(screen.getByText(mockVideo.description)).toBeInTheDocument();
    });

    it('should display video duration', () => {
      render(<VideoPlayer video={mockVideo} />);

      expect(screen.getByText(mockVideo.duration)).toBeInTheDocument();
    });
  });

  describe('Progress Tracking', () => {
    it('should show unwatched state initially', () => {
      render(<VideoPlayer video={mockVideo} />);

      expect(screen.getByText(/not watched/i)).toBeInTheDocument();
    });

    it('should allow marking video as watched', async () => {
      render(<VideoPlayer video={mockVideo} onProgressUpdate={jest.fn()} />);

      const watchedButton = screen.getByRole('button', { name: /mark.*watched/i });
      fireEvent.click(watchedButton);

      await waitFor(() => {
        const watchedElements = screen.getAllByText(/watched/i);
        expect(watchedElements.length).toBeGreaterThan(0);
      });
    });

    it('should call onProgressUpdate callback when marked as watched', () => {
      const onProgressUpdate = jest.fn();
      render(<VideoPlayer video={mockVideo} onProgressUpdate={onProgressUpdate} />);

      const watchedButton = screen.getByRole('button', { name: /mark.*watched/i });
      fireEvent.click(watchedButton);

      expect(onProgressUpdate).toHaveBeenCalledWith(mockVideo.id, true);
    });

    it('should display watched indicator when video is completed', () => {
      render(<VideoPlayer video={mockVideo} isWatched={true} />);

      expect(screen.getByTestId('watched-indicator')).toBeInTheDocument();
    });
  });

  describe('Course Structure', () => {
    it('should display course metadata when provided', () => {
      const courseInfo = {
        courseTitle: 'GapRadar Masterclass',
        lessonNumber: 1,
        totalLessons: 5,
      };

      render(<VideoPlayer video={mockVideo} courseInfo={courseInfo} />);

      expect(screen.getByText(/Lesson 1 of 5/i)).toBeInTheDocument();
      expect(screen.getByText(courseInfo.courseTitle)).toBeInTheDocument();
    });

    it('should show next lesson button when available', () => {
      const onNext = jest.fn();
      render(<VideoPlayer video={mockVideo} onNext={onNext} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeInTheDocument();

      fireEvent.click(nextButton);
      expect(onNext).toHaveBeenCalled();
    });

    it('should show previous lesson button when available', () => {
      const onPrevious = jest.fn();
      render(<VideoPlayer video={mockVideo} onPrevious={onPrevious} />);

      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).toBeInTheDocument();

      fireEvent.click(prevButton);
      expect(onPrevious).toHaveBeenCalled();
    });

    it('should not show next button on last lesson', () => {
      const courseInfo = {
        courseTitle: 'GapRadar Masterclass',
        lessonNumber: 5,
        totalLessons: 5,
      };

      render(<VideoPlayer video={mockVideo} courseInfo={courseInfo} />);

      const nextButton = screen.queryByRole('button', { name: /next/i });
      expect(nextButton).not.toBeInTheDocument();
    });

    it('should not show previous button on first lesson', () => {
      const courseInfo = {
        courseTitle: 'GapRadar Masterclass',
        lessonNumber: 1,
        totalLessons: 5,
      };

      render(<VideoPlayer video={mockVideo} courseInfo={courseInfo} />);

      const prevButton = screen.queryByRole('button', { name: /previous/i });
      expect(prevButton).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper iframe attributes for accessibility', () => {
      render(<VideoPlayer video={mockVideo} />);

      const iframe = screen.getByTitle(mockVideo.title);
      expect(iframe).toHaveAttribute('allowFullScreen');
    });

    it('should have accessible buttons', () => {
      render(<VideoPlayer video={mockVideo} onNext={jest.fn()} onPrevious={jest.fn()} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive aspect ratio container', () => {
      const { container } = render(<VideoPlayer video={mockVideo} />);

      const aspectRatioContainer = container.querySelector('[class*="aspect-video"]');
      expect(aspectRatioContainer).toBeInTheDocument();
    });

    it('should have responsive iframe sizing', () => {
      render(<VideoPlayer video={mockVideo} />);

      const iframe = screen.getByTitle(mockVideo.title);
      expect(iframe).toHaveClass('w-full', 'h-full');
    });
  });
});
