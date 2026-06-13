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
  lesson_coin_reward_suggestions,
  teacher_payouts,
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
  voice_video_room_coin_transactions,
  voice_video_room_sessions,
  voice_video_room_participants,
  voice_video_rooms,
  direct_messages,
  direct_conversations,
  saved_posts,
  post_appreciations,
  post_views,
  post_comments,
  post_likes,
  posts,
  story_comments,
  user_follows,
  goal_supports,
  goal_templates,
  goals,
  user_learning_path_progress,
  learning_path_items,
  learning_paths,
  user_story_states,
  story_translations,
  stories,
  story_categories,
  user_sentence_review_results,
  user_saved_sentence_decks,
  sentence_deck_items,
  sentence_deck_topics,
  sentence_decks,
  user_sentence_reviews,
  sentences,
  coin_transactions,
  coin_rules,
  user_sessions,
  wallets,
  user_languages,
  users,
  supported_languages
cascade;

commit;
