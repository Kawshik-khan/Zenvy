-- Calls ring during focus sessions again, so the focus status is no longer stored.
ALTER TABLE "User" DROP COLUMN "focusUntil";
