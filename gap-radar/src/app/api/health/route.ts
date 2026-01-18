import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Health Check Endpoint
 *
 * Returns 200 when healthy, 503 when unhealthy.
 * Used for monitoring and load balancing.
 *
 * Response format:
 * {
 *   status: 'healthy' | 'unhealthy',
 *   timestamp: string,
 *   version: string,
 *   checks: {
 *     database: 'ok' | 'error: <message>'
 *   }
 * }
 */

// Get version from package.json
const version = process.env.npm_package_version || '0.1.0';

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: string;
  };
}

async function checkDatabase(): Promise<{ status: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Try a simple query to verify database connectivity
    // We'll just check if we can query the runs table (or any table)
    const { data, error } = await supabase
      .from('runs')
      .select('id')
      .limit(1);

    if (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }

    return {
      status: 'ok',
    };
  } catch (err) {
    return {
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();

  try {
    // Perform health checks
    const dbCheck = await checkDatabase();

    const isHealthy = dbCheck.status === 'ok';

    const response: HealthCheckResponse = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp,
      version,
      checks: {
        database: dbCheck.error ? `error: ${dbCheck.error}` : 'ok',
      },
    };

    return NextResponse.json(response, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    // Catch-all for unexpected errors
    const response: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp,
      version,
      checks: {
        database: `error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
    };

    return NextResponse.json(response, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}
