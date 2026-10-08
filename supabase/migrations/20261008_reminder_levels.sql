-- Run before copying the updated frontend. Existing rows remain compatible.
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS reminder_level text;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_reminder_level_check' AND conrelid = 'public.notifications'::regclass) THEN
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_reminder_level_check
      CHECK (reminder_level IS NULL OR reminder_level IN ('urgent', 'month', 'week', 'daily', 'normal'));
  END IF;
END $$;
-- Existing severity and RLS policies are preserved.
