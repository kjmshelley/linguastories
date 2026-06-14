do $$
declare
  requested_tables text[] := array[
    'email_notification_queue',
    'account_notifications',
    'billing_invoices',
    'billing_payment_methods',
    'billing_webhook_events',
    'account_events',
    'user_accounts',
    'lesson_coin_reward_suggestions',
    'teacher_payouts',
    'teacher_reviews',
    'lesson_template_resources',
    'lesson_templates',
    'teacher_resources',
    'lesson_notes',
    'teacher_private_notes',
    'teacher_student_relationships',
    'classroom_sessions',
    'lesson_reschedule_requests',
    'lesson_payments',
    'lesson_participants',
    'lesson_bookings',
    'teacher_subscriptions',
    'teacher_unavailable_blocks',
    'teacher_availability_rules',
    'teacher_booking_rules',
    'teacher_lesson_settings',
    'teacher_profile_tags',
    'teacher_profile_languages',
    'teacher_profiles',
    'teacher_subscription_plans',
    'voice_video_room_coin_transactions',
    'voice_video_room_sessions',
    'voice_video_room_participants',
    'voice_video_rooms',
    'direct_messages',
    'direct_conversations',
    'saved_posts',
    'post_appreciations',
    'post_views',
    'post_comments',
    'post_likes',
    'posts',
    'story_comments',
    'user_follows',
    'goal_supports',
    'goal_templates',
    'goals',
    'user_learning_path_progress',
    'learning_path_items',
    'learning_paths',
    'user_story_states',
    'story_translations',
    'stories',
    'story_categories',
    'user_sentence_review_results',
    'user_saved_sentence_decks',
    'sentence_deck_items',
    'sentence_deck_topics',
    'sentence_decks',
    'user_sentence_reviews',
    'sentences',
    'coin_transactions',
    'coin_rules',
    'user_sessions',
    'wallets',
    'user_languages',
    'users',
    'supported_languages'
  ];
  existing_tables text;
begin
  select string_agg(format('%I.%I', table_schema, table_name), ', ')
    into existing_tables
    from information_schema.tables
   where table_schema = 'public'
     and table_type = 'BASE TABLE'
     and table_name = any(requested_tables);

  if existing_tables is not null then
    execute format('truncate table %s restart identity cascade', existing_tables);
  end if;
end $$;
