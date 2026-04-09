/**
 * Supabase setup: creates storage bucket and verifies table access.
 * Tables must be created first via: scripts/migration.sql (run in Supabase Dashboard > SQL Editor)
 * Run with: node scripts/setup-supabase.mjs
 */

const SUPABASE_URL = "https://uivwihnytvmlnkyzuxmo.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpdndpaG55dHZtbG5reXp1eG1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY2NjkzNywiZXhwIjoyMDkxMjQyOTM3fQ.lTrQ1Ux4Y9erUGD633pqQ8jlvNzMgfiI8Pb3iEKKw6Y";

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

async function createStorageBucket() {
  console.log("Creating storage bucket 'images'...");
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      id: "images",
      name: "images",
      public: true,
      file_size_limit: 5242880, // 5MB
      allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    }),
  });

  if (res.ok) {
    console.log("  ✓ Bucket 'images' created");
  } else {
    const body = await res.json().catch(() => ({}));
    if (body?.message?.includes("already exists")) {
      console.log("  ✓ Bucket 'images' already exists");
    } else {
      console.log(`  ✗ Bucket creation failed: ${res.status}`, body);
    }
  }
}

async function main() {
  console.log("=== Supabase Setup ===\n");
  await createStorageBucket();

  // Verify via REST
  console.log("\nVerifying table access via REST API...");
  let allOk = true;
  for (const table of ["stories", "news_articles", "cached_images"]) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=count&limit=0`,
      { headers }
    );
    if (res.ok) {
      console.log(`  ✓ Table '${table}' accessible`);
    } else {
      console.log(`  ✗ Table '${table}' not found`);
      allOk = false;
    }
  }

  if (!allOk) {
    console.log("\n⚠ Some tables are missing. Run scripts/migration.sql in:");
    console.log("  Supabase Dashboard > SQL Editor > New Query");
  } else {
    console.log("\n✓ All tables ready!");
  }
}

main().catch(console.error);
