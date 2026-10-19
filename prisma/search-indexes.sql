-- Optional Supabase/Postgres indexes for Discord-style people search.
-- Run this once against the production database after reviewing it.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS user_name_trgm_idx
  ON "User" USING gin (lower("name") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS user_unique_id_trgm_idx
  ON "User" USING gin (lower("uniqueId") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS user_email_handle_trgm_idx
  ON "User" USING gin (lower(split_part("email", '@', 1)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS profile_people_search_vector_idx
  ON "Profile"
  USING gin (
    to_tsvector(
      'simple',
      coalesce("major", '') || ' ' ||
      coalesce("college", '') || ' ' ||
      coalesce("bio", '') || ' ' ||
      coalesce("interests", '') || ' ' ||
      coalesce("availability", '')
    )
  );

CREATE INDEX IF NOT EXISTS profile_people_text_trgm_idx
  ON "Profile"
  USING gin (
    lower(
      coalesce("major", '') || ' ' ||
      coalesce("college", '') || ' ' ||
      coalesce("bio", '') || ' ' ||
      coalesce("interests", '') || ' ' ||
      coalesce("availability", '')
    ) gin_trgm_ops
  );

CREATE INDEX IF NOT EXISTS group_member_user_group_idx
  ON "GroupMember" ("userId", "groupId");

CREATE INDEX IF NOT EXISTS channel_member_user_channel_idx
  ON "ChannelMember" ("userId", "channelId");
