-- =====================================================================
-- MRDiet — Production Migration (2026-05-18)
-- Run on existing DB: mrdietweb
--
-- This session's changes:
--   • Added "Mobile App Links" feature → seeds 2 new keys in `settings`
--     (play_store_url, app_store_url) for the sidebar Play Store / App
--     Store buttons. Admin can fill these in /admin/settings → General.
--
-- Everything else in this session was code-only (no schema change):
--   • AI variety fix (PHP logic + frontend wiring)
--   • Gateway 404 fix (.htaccess + Vite proxy)
--   • Early-unlock modal + swap-disable (frontend only)
--   • Dashboard parallel API calls (frontend only)
--
-- Safe to run multiple times — INSERT IGNORE skips existing rows.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Seed mobile-app-store URL settings (blank by default → users get
--    redirected to /coming-soon until admin fills these in)
-- ---------------------------------------------------------------------
INSERT IGNORE INTO `settings` (`setting_key`, `setting_value`) VALUES
  ('play_store_url', ''),
  ('app_store_url',  '');

-- ---------------------------------------------------------------------
-- DONE.
-- Verify:
--   SELECT setting_key, setting_value FROM settings
--     WHERE setting_key IN ('play_store_url','app_store_url');
-- ---------------------------------------------------------------------
