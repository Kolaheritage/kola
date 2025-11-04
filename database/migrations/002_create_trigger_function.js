/**
 * Migration: Create Trigger Function for updated_at
 * Creates a reusable function to auto-update updated_at timestamps
 */

exports.up = (pgm) => {
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP FUNCTION IF EXISTS update_updated_at_column();');
};