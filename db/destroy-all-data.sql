-- Drops database objects created for this project.
-- This intentionally targets only the named LinguaStories objects below. It does
-- not sweep the whole public schema and does not drop shared/system objects such
-- as extensions.
--
-- Run db:schema afterward to recreate the schema, then db:seed if you want to
-- repopulate seed data.
--
-- Run with:
--   npm run db:destroy-all-objects
--   npm run db:destroy-all-data
--   npm run db:destroy-all-objects:prod
--   npm run db:destroy-all-data:prod

begin;

drop table if exists
  email_notification_queue,
  account_notifications,
  billing_invoices,
  billing_payment_methods,
  billing_webhook_events,
  account_events,
  user_accounts,
  subscription_tiers,
  teacher_payouts,
  teacher_payout_accounts,
  teacher_reviews,
  lesson_template_resources,
  lesson_templates,
  teacher_resources,
  lesson_notes,
  teacher_private_notes,
  teacher_student_relationships,
  classroom_sessions,
  lesson_reschedule_requests,
  lesson_payments,
  lesson_participants,
  lesson_bookings,
  teacher_subscriptions,
  teacher_unavailable_blocks,
  teacher_availability_rules,
  teacher_booking_rules,
  teacher_lesson_settings,
  teacher_profile_tags,
  teacher_profile_languages,
  teacher_profiles,
  teacher_subscription_plans,
  voice_video_room_sessions,
  voice_video_room_participants,
  voice_video_rooms,
  direct_messages,
  direct_conversations,
  post_comments,
  post_likes,
  posts,
  user_follows,
  user_sessions,
  user_languages,
  users,
  supported_languages
cascade;

commit;
