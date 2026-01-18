import { ImageResponse } from 'next/og';

// Image metadata
export const alt = 'GapRadar - AI-Powered Market Gap Analysis';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          backgroundImage:
            'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
          }}
        >
          {/* Logo/Title */}
          <div
            style={{
              fontSize: 96,
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              marginBottom: '20px',
            }}
          >
            GapRadar
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: 40,
              color: '#e2e8f0',
              textAlign: 'center',
              maxWidth: '900px',
              marginBottom: '30px',
            }}
          >
            Find Market Gaps Before Your Competitors
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: 28,
              color: '#94a3b8',
              textAlign: 'center',
              maxWidth: '900px',
            }}
          >
            Analyze Meta ads, Google ads, and Reddit to discover what customers
            want—and what competitors are missing
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
