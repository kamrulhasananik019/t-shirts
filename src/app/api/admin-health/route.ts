import { NextResponse } from 'next/server';
import { countAdminItems } from '@/services/admin.service';

export const runtime = 'nodejs';

/**
 * Health check endpoint for admin setup
 * Verifies MongoDB + admin collections + content collections
 */
export async function GET() {
  try {
    const checks = {
      environment: { ok: false, message: '' },
      database: { ok: false, message: '' },
      admin: { ok: false, message: '' },
      collections: { ok: false, message: '' },
    };

    if (!process.env.MONGODB_URI) {
      checks.environment.message = 'Missing MONGODB_URI in .env.local';
    } else {
      checks.environment.ok = true;
      checks.environment.message = 'Environment variables configured';
    }

    if (!checks.environment.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: 'FAILED',
          checks,
          setupGuide: 'See ADMIN_SETUP.md for configuration instructions',
        },
        { status: 503, headers: { 'Cache-Control': 'no-store, private, max-age=0' } }
      );
    }

    try {
      const counts = await countAdminItems();
      checks.database.ok = true;
      checks.database.message = 'Connected to MongoDB';

      if (counts.admins > 0) {
        checks.admin.ok = true;
        checks.admin.message = 'Admin user exists';
      } else {
        checks.admin.ok = false;
        checks.admin.message = 'No admin user found in admins collection.';
      }

      checks.collections.ok = true;
      checks.collections.message = `Categories: ${counts.categories} docs, Products: ${counts.products} docs, FAQs: ${counts.faqs} docs`;
    } catch (dbError) {
      checks.database.ok = false;
      checks.database.message = dbError instanceof Error ? dbError.message : 'Database connection failed';
      checks.admin.ok = false;
      checks.admin.message = 'Could not verify admin user (database error)';
      checks.collections.ok = false;
      checks.collections.message = 'Could not verify collections (database error)';
    }

    const allOk = Object.values(checks).every((check) => check.ok);

    return NextResponse.json(
      {
        ok: allOk,
        status: allOk ? 'HEALTHY' : 'DEGRADED',
        checks,
        nextSteps: !allOk
          ? ['Review the checks above for failures']
          : ['Visit /admin/login to access the custom admin panel'],
      },
      { status: allOk ? 200 : 503, headers: { 'Cache-Control': 'no-store, private, max-age=0' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        ok: false,
        status: 'ERROR',
        error: errorMessage,
        setupGuide: 'Set MONGODB_URI in .env.local',
      },
      { status: 500, headers: { 'Cache-Control': 'no-store, private, max-age=0' } }
    );
  }
}
