import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/v1/docs
 * Serve OpenAPI documentation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'yaml';

    const openApiPath = path.join(process.cwd(), 'public', 'api', 'openapi.yaml');
    const openApiContent = fs.readFileSync(openApiPath, 'utf-8');

    if (format === 'json') {
      // For JSON format, we'd need to parse YAML and convert
      // For now, just return YAML with appropriate content-type
      return new NextResponse(openApiContent, {
        headers: {
          'Content-Type': 'application/x-yaml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    return new NextResponse(openApiContent, {
      headers: {
        'Content-Type': 'application/x-yaml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving OpenAPI docs:', error);
    return NextResponse.json(
      { error: 'Failed to load API documentation' },
      { status: 500 }
    );
  }
}
