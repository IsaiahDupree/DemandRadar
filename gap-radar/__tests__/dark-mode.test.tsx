import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, useTheme } from '@/components/theme-provider'
import { ThemeToggle } from '@/components/theme-toggle'

// Test component to expose theme controls
function TestThemeComponent() {
  const { theme, setTheme } = useTheme()
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <button onClick={() => setTheme('dark')} data-testid="set-dark">Set Dark</button>
      <button onClick={() => setTheme('light')} data-testid="set-light">Set Light</button>
      <button onClick={() => setTheme('system')} data-testid="set-system">Set System</button>
    </div>
  )
}

// Mock matchMedia globally
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

describe('Dark Mode', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Reset document class
    document.documentElement.classList.remove('dark', 'light')
    // Reset matchMedia mock
    ;(window.matchMedia as jest.Mock).mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))
  })

  it('should render theme toggle button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const toggleButton = screen.getByRole('button', { name: /toggle theme/i })
    expect(toggleButton).toBeInTheDocument()
  })

  it('should toggle between light and dark modes', () => {
    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    )

    // Initial state should be light mode (or system default)
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    // Click to set dark mode
    const darkButton = screen.getByTestId('set-dark')
    fireEvent.click(darkButton)
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    // Click to set light mode
    const lightButton = screen.getByTestId('set-light')
    fireEvent.click(lightButton)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should persist theme preference in localStorage', () => {
    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    )

    // Set dark mode
    const darkButton = screen.getByTestId('set-dark')
    fireEvent.click(darkButton)

    // Check localStorage
    expect(localStorage.getItem('theme')).toBe('dark')

    // Set light mode
    const lightButton = screen.getByTestId('set-light')
    fireEvent.click(lightButton)
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('should load theme from localStorage on mount', () => {
    // Set dark mode in localStorage before rendering
    localStorage.setItem('theme', 'dark')

    render(
      <ThemeProvider>
        <TestThemeComponent />
      </ThemeProvider>
    )

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should support system theme preference', () => {
    // Mock matchMedia to return dark mode preference
    ;(window.matchMedia as jest.Mock).mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    render(
      <ThemeProvider defaultTheme="system">
        <TestThemeComponent />
      </ThemeProvider>
    )

    // Should apply dark mode based on system preference
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
