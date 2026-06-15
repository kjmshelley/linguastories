-- Seeded account password: Juy90n1!

begin;

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
    'voice_video_room_sessions',
    'voice_video_room_participants',
    'voice_video_rooms',
    'direct_messages',
    'direct_conversations',
    'post_comments',
    'post_likes',
    'posts',
    'user_follows',
    'user_sessions',
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

alter table if exists supported_languages
  add column if not exists code text;

do $$
begin
  alter table supported_languages
    add constraint supported_languages_code_key unique (code);
exception
  when duplicate_object or duplicate_table then null;
end $$;

insert into supported_languages (code, name, sort_order, active)
values
  ('af', 'Afrikaans', 1, true),
  ('sq', 'Albanian', 2, true),
  ('am', 'Amharic', 3, true),
  ('ar-SA', 'Arabic', 4, true),
  ('hy', 'Armenian', 5, true),
  ('az', 'Azerbaijani', 6, true),
  ('eu', 'Basque', 7, true),
  ('be', 'Belarusian', 8, true),
  ('bn', 'Bengali', 9, true),
  ('bs', 'Bosnian', 10, true),
  ('bg', 'Bulgarian', 11, true),
  ('my', 'Burmese', 12, true),
  ('ca', 'Catalan', 13, true),
  ('ceb', 'Cebuano', 14, true),
  ('zh-CN', 'Chinese', 15, true),
  ('hr', 'Croatian', 16, true),
  ('cs', 'Czech', 17, true),
  ('da', 'Danish', 18, true),
  ('nl-NL', 'Dutch', 19, true),
  ('en-US', 'English', 20, true),
  ('eo', 'Esperanto', 21, true),
  ('et', 'Estonian', 22, true),
  ('fil', 'Filipino', 23, true),
  ('fi', 'Finnish', 24, true),
  ('fr-FR', 'French', 25, true),
  ('gl', 'Galician', 26, true),
  ('ka', 'Georgian', 27, true),
  ('de-DE', 'German', 28, true),
  ('el', 'Greek', 29, true),
  ('gu', 'Gujarati', 30, true),
  ('ht', 'Haitian Creole', 31, true),
  ('ha', 'Hausa', 32, true),
  ('he', 'Hebrew', 33, true),
  ('hi-IN', 'Hindi', 34, true),
  ('hmn', 'Hmong', 35, true),
  ('hu', 'Hungarian', 36, true),
  ('is', 'Icelandic', 37, true),
  ('ig', 'Igbo', 38, true),
  ('id-ID', 'Indonesian', 39, true),
  ('ga', 'Irish', 40, true),
  ('it-IT', 'Italian', 41, true),
  ('ja-JP', 'Japanese', 42, true),
  ('jv', 'Javanese', 43, true),
  ('kn', 'Kannada', 44, true),
  ('kk', 'Kazakh', 45, true),
  ('km', 'Khmer', 46, true),
  ('ko-KR', 'Korean', 47, true),
  ('ku', 'Kurdish', 48, true),
  ('ky', 'Kyrgyz', 49, true),
  ('lo', 'Lao', 50, true),
  ('la', 'Latin', 51, true),
  ('lv', 'Latvian', 52, true),
  ('lt', 'Lithuanian', 53, true),
  ('lb', 'Luxembourgish', 54, true),
  ('mk', 'Macedonian', 55, true),
  ('mg', 'Malagasy', 56, true),
  ('ms', 'Malay', 57, true),
  ('ml', 'Malayalam', 58, true),
  ('mt', 'Maltese', 59, true),
  ('mi', 'Maori', 60, true),
  ('mr', 'Marathi', 61, true),
  ('mn', 'Mongolian', 62, true),
  ('ne', 'Nepali', 63, true),
  ('no', 'Norwegian', 64, true),
  ('ny', 'Nyanja', 65, true),
  ('ps', 'Pashto', 66, true),
  ('fa', 'Persian', 67, true),
  ('pl-PL', 'Polish', 68, true),
  ('pt-PT', 'Portuguese', 69, true),
  ('pa', 'Punjabi', 70, true),
  ('ro', 'Romanian', 71, true),
  ('ru-RU', 'Russian', 72, true),
  ('sm', 'Samoan', 73, true),
  ('gd', 'Scottish Gaelic', 74, true),
  ('sr', 'Serbian', 75, true),
  ('st', 'Sesotho', 76, true),
  ('sn', 'Shona', 77, true),
  ('sd', 'Sindhi', 78, true),
  ('si', 'Sinhala', 79, true),
  ('sk', 'Slovak', 80, true),
  ('sl', 'Slovenian', 81, true),
  ('so', 'Somali', 82, true),
  ('es-ES', 'Spanish', 83, true),
  ('su', 'Sundanese', 84, true),
  ('sw', 'Swahili', 85, true),
  ('sv-SE', 'Swedish', 86, true),
  ('tg', 'Tajik', 87, true),
  ('ta', 'Tamil', 88, true),
  ('te', 'Telugu', 89, true),
  ('th-TH', 'Thai', 90, true),
  ('tr-TR', 'Turkish', 91, true),
  ('uk-UA', 'Ukrainian', 92, true),
  ('ur', 'Urdu', 93, true),
  ('uz', 'Uzbek', 94, true),
  ('vi-VN', 'Vietnamese', 95, true),
  ('cy', 'Welsh', 96, true),
  ('xh', 'Xhosa', 97, true),
  ('yi', 'Yiddish', 98, true),
  ('yo', 'Yoruba', 99, true),
  ('zu', 'Zulu', 100, true),
  ('ak', 'Akan', 101, true),
  ('as', 'Assamese', 102, true),
  ('ay', 'Aymara', 103, true),
  ('bm', 'Bambara', 104, true),
  ('bho', 'Bhojpuri', 105, true),
  ('co', 'Corsican', 106, true),
  ('dv', 'Divehi', 107, true),
  ('ee', 'Ewe', 108, true),
  ('fy', 'Frisian', 109, true),
  ('rw', 'Kinyarwanda', 110, true)
on conflict (code) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    active = true;


do $$
<<seed_data>>
declare
  password_hash constant text := 'pbkdf2_sha256$310000$linguastories-demo-salt$4dcf782c48e2ddcfca5e2fc7babb9ecaf14ed4318768aea46ee4be4b0992b75d';
  user_specs text[][] := array[
    array['Mika Tan','demo@linguastories.local','MT','en-US','ja-JP','A2','Building fluency through live lessons and steady practice.'],
    array['Noah Reed','noah@linguastories.local','NR','en-US','ja-JP','A2','Travel-focused learner preparing for practical speaking lessons.'],
    array['Ari Kim','ari@linguastories.local','AK','en-US','ja-JP','B1','Building confidence through weekly lessons and community practice.'],
    array['Sofia Rivera','sofia@linguastories.local','SR','en-US','es-ES','A2','Cafe conversations, train stations, and small wins every morning.'],
    array['Mateo Cruz','mateo@linguastories.local','MC','en-US','es-ES','B1','Spanish learner focused on travel and speaking confidence.'],
    array['Camille Stone','camille@linguastories.local','CS','en-US','fr-FR','A1','French beginner building a weekend speaking routine.'],
    array['Hana Park','hana@linguastories.local','HP','en-US','ko-KR','A2','Korean learner who studies through guided group practice.'],
    array['Eli Morgan','eli@linguastories.local','EM','en-US','ja-JP','A1','Starting over with Japanese and keeping the streak gentle.'],
    array['Priya Shah','priya@linguastories.local','PS','hi-IN','ja-JP','A2','Uses teacher feedback to make grammar feel less abstract.'],
    array['Lucas Meyer','lucas@linguastories.local','LM','de-DE','es-ES','A1','Spanish learner who loves food scenes and travel notes.'],
    array['Nora Ellis','nora@linguastories.local','NE','en-US','fr-FR','A2','Collects useful weekend phrases and reads aloud after work.'],
    array['Kenji Brooks','kenji@linguastories.local','KB','en-US','ko-KR','B1','Korean study-group regular focused on listening and speaking.'],
    array['Amara Okafor','amara@linguastories.local','AO','en-US','ja-JP','B2','Advanced learner who shares grammar questions with the community.'],
    array['Theo Grant','theo@linguastories.local','TG','en-US','es-ES','A2','Building travel confidence one conversation at a time.'],
    array['Lina Chen','lina@linguastories.local','LC','zh-CN','fr-FR','A1','French beginner who likes simple daily-life conversations.'],
    array['Owen Patel','owen@linguastories.local','OP','en-US','ja-JP','A2','Practices pronunciation before workplace meetings.']
  ];
  spec text[];
  idx integer := 0;
  new_user_id uuid;
  supporter uuid;
  recipient uuid;
  conversation_id uuid;
  post_id uuid;
  room_id uuid;
  room_host_id uuid;
  room_guest_id uuid;
  room_participant_id uuid;
  room_session_id uuid;
  teacher_user_id uuid;
  student_user_id uuid;
  teacher_profile_id uuid;
  lesson_id uuid;
  teacher_resource_id uuid;
  lesson_template_id uuid;
begin
  foreach spec slice 1 in array user_specs loop
    idx := idx + 1;
    insert into users (
      display_name, email, password_hash, avatar, bio, native_language, target_language, current_level,
      current_streak, longest_streak, listening_time
    )
    values (
      spec[1], spec[2], password_hash, spec[3], spec[7], spec[4], spec[5], spec[6],
      2 + (idx % 11), 8 + (idx % 21), 40 + (idx * 13)
    )
    returning id into new_user_id;

    insert into user_languages (
      user_id, language, current_level, current_streak, longest_streak, listening_time, profile_visibility, active
    )
    values (
      new_user_id, spec[5], spec[6], 2 + (idx % 11), 8 + (idx % 21), 40 + (idx * 13), 'Public', true
    );

    if idx % 3 = 0 then
      insert into user_languages (user_id, language, current_level, profile_visibility, active)
      values (new_user_id, 'ja-JP', 'A1', 'Public', true)
      on conflict do nothing;
    elsif idx % 3 = 1 then
      insert into user_languages (user_id, language, current_level, profile_visibility, active)
      values (new_user_id, 'es-ES', 'A1', 'Public', true)
      on conflict do nothing;
    else
      insert into user_languages (user_id, language, current_level, profile_visibility, active)
      values (new_user_id, 'fr-FR', 'A1', 'Private', true)
      on conflict do nothing;
    end if;
  end loop;


  for idx in 1..16 loop
    select id into new_user_id from users order by display_name offset idx - 1 limit 1;

    insert into posts (user_id, type, body, target_language, created_at)
    values (
      new_user_id,
      case idx % 4 when 0 then 'Question Post' when 1 then 'Learning Update' when 2 then 'Practice Note' else 'Lesson Win' end,
      case idx % 4
        when 0 then 'Does anyone have a good way to practice before a live lesson?'
        when 1 then 'I booked my next lesson and wrote down three questions I want to ask.'
        when 2 then 'Today I practiced speaking out loud for ten minutes. Small, but it helped.'
        else 'My teacher corrected one phrase and I finally used it naturally in conversation.'
      end,
      (select target_language from users where id = new_user_id),
      now() - ((idx * 7) || ' hours')::interval
    )
    returning id into post_id;

    insert into posts (user_id, type, body, target_language, created_at)
    values (
      new_user_id,
      'Learning Update',
      'Tiny win: I joined a practice room and felt less nervous speaking with other learners.',
      (select target_language from users where id = new_user_id),
      now() - ((idx * 7 + 3) || ' hours')::interval
    );
  end loop;

  insert into post_likes (post_id, user_id, created_at)
  select p.id, u.id, p.created_at + interval '30 minutes'
  from posts p
  join users u on u.id <> p.user_id
  where (abs(hashtext(p.id::text || u.id::text)) % 4) = 0
  on conflict do nothing;

  insert into post_comments (post_id, user_id, body, created_at)
  select p.id,
         u.id,
         case abs(hashtext(u.id::text || p.id::text)) % 5
           when 0 then 'This is a helpful way to prepare for a lesson.'
           when 1 then 'Nice progress. I like keeping practice small too.'
           when 2 then 'I saved this idea for my next study session.'
           when 3 then 'That sounds realistic. Keep going.'
           else 'Thanks for sharing the context. It makes the practice feel doable.'
         end,
         p.created_at + interval '1 hour'
  from posts p
  join users u on u.id <> p.user_id
  where (abs(hashtext(u.email || p.id::text)) % 6) = 0;

  insert into user_follows (follower_id, following_id, created_at)
  select follower.id, following.id, now() - ((abs(hashtext(follower.email || following.email)) % 20) || ' days')::interval
  from users follower
  join users following on following.id <> follower.id
  where follower.target_language = following.target_language
     or (abs(hashtext(follower.email || following.email)) % 5) = 0
  on conflict do nothing;

  for supporter, recipient in
    select f.follower_id, f.following_id
    from user_follows f
    join users u1 on u1.id = f.follower_id
    join users u2 on u2.id = f.following_id
    order by u1.display_name, u2.display_name
    limit 28
  loop
    insert into direct_conversations (participant_one, participant_two, created_at, updated_at)
    values (supporter, recipient, now() - interval '5 days', now() - interval '1 hour')
    on conflict do nothing;

    select id into conversation_id
    from direct_conversations
    where least(participant_one::text, participant_two::text) = least(supporter::text, recipient::text)
      and greatest(participant_one::text, participant_two::text) = greatest(supporter::text, recipient::text)
    limit 1;

    insert into direct_messages (conversation_id, sender_id, recipient_id, body, read_at, created_at)
    values
      (conversation_id, supporter, recipient, 'Your latest post reminded me to practice before class today.', now() - interval '3 hours', now() - interval '4 hours'),
      (conversation_id, recipient, supporter, 'Thank you. I am trying to keep practice small enough to repeat.', now() - interval '2 hours', now() - interval '3 hours'),
      (conversation_id, supporter, recipient, 'Same here. A short daily practice goal feels easier to keep.', null, now() - interval '1 hour');
  end loop;

  update users
     set avatar_url = 'https://images.unsplash.com/photo-' ||
       case (abs(hashtext(email)) % 12)
         when 0 then '1494790108377-be9c29b29330'
         when 1 then '1500648767791-00dcc994a43e'
         when 2 then '1534528741775-53994a69daeb'
         when 3 then '1517841905240-472988babdf9'
         when 4 then '1527980965255-d3b416303d12'
         when 5 then '1544005313-94ddf0286df2'
         when 6 then '1506794778202-cad84cf45f1d'
         when 7 then '1547425260-76bcadfb4f2c'
         when 8 then '1552058544-f2b08422138a'
         when 9 then '1492562080023-ab3db95bfbce'
         when 10 then '1544723795-3fb6469f5b39'
         else '1531123897727-8f129e1688ce'
       end || '?auto=format&fit=crop&w=240&q=80';

  insert into subscription_tiers (
    tier_key, name, monthly_price_usd, yearly_price_usd, trial_eligible, trial_length_days,
    permissions, feature_flags, account_type, signup_visible, sort_order
  )
  values
    (
      'free', 'Free Membership', 0, 0, false, 0,
      '["voice_video_rooms","connect","community_posts","find_teacher","my_schedule","practice"]'::jsonb,
      '{"dashboard":true,"connect":true,"communityPosts":true,"voiceVideoRooms":true,"findTeacher":true,"mySchedule":true,"practice":true,"maxLanguageProfiles":10,"canEditLanguageProfiles":true,"canDeleteLanguageProfiles":true,"teacherWorkspace":false,"groupLessons":false}'::jsonb,
      'learner', true, 10
    ),
    (
      'teacher', 'Teacher', 0, 0, false, 0,
      '["voice_video_rooms","teacher_workspace","teacher_profile","connect","community_posts","find_teacher","my_schedule","practice","language_profiles"]'::jsonb,
      '{"dashboard":true,"connect":true,"communityPosts":true,"voiceVideoRooms":true,"findTeacher":true,"mySchedule":true,"practice":true,"maxLanguageProfiles":null,"canEditLanguageProfiles":true,"canDeleteLanguageProfiles":true,"teacherWorkspace":true,"groupLessons":false}'::jsonb,
      'teacher', true, 20
    )
  on conflict (tier_key) do update
  set name = excluded.name,
      monthly_price_usd = excluded.monthly_price_usd,
      yearly_price_usd = excluded.yearly_price_usd,
      trial_eligible = excluded.trial_eligible,
      trial_length_days = excluded.trial_length_days,
      permissions = excluded.permissions,
      feature_flags = excluded.feature_flags,
      account_type = excluded.account_type,
      signup_visible = excluded.signup_visible,
      sort_order = excluded.sort_order,
      active = true,
      updated_at = now();

  insert into teacher_subscription_plans (plan_key, name, monthly_price_usd, can_create_group_lessons)
  values
    ('teacher', 'Teacher', 0, false)
  on conflict (plan_key) do update
  set name = excluded.name,
      monthly_price_usd = excluded.monthly_price_usd,
      can_create_group_lessons = excluded.can_create_group_lessons,
      active = true;

  for idx in 1..10 loop
    select id into room_host_id from users order by display_name offset idx - 1 limit 1;
    insert into voice_video_rooms (
      owner_user_id, title, description, room_type, target_language, source_language, cefr_level,
      max_participants, is_private, status, livekit_room_name, image_url, image_file_id, created_at, started_at, ended_at
    )
    values (
      room_host_id,
      case idx % 5
        when 0 then 'Four-person pronunciation sprint'
        when 1 then 'Travel phrase practice room'
        when 2 then 'Conversation warm-up circle'
        when 3 then 'Cafe roleplay room'
        else 'Study group warm-up'
      end,
      'Seeded room for checking the voice/video rooms list, history, participant counts, and moderation controls.',
      case when idx % 3 = 0 then 'voice' else 'video' end,
      (select target_language from users where id = room_host_id),
      'en-US',
      case idx % 6 when 0 then 'A1' when 1 then 'A2' when 2 then 'B1' when 3 then 'B2' when 4 then 'C1' else 'C2' end,
      2 + (idx % 3),
      idx % 4 = 0,
      case when idx <= 6 then 'active' when idx <= 8 then 'ended' else 'cancelled' end,
      'seed-livekit-room-' || idx,
      'https://images.unsplash.com/photo-' ||
        case idx % 6
          when 0 then '1516321318423-f06f85e504b3'
          when 1 then '1522202176988-66273c2fd55f'
          when 2 then '1517245386807-bb43f82c33c4'
          when 3 then '1523240795612-9a054b0db644'
          when 4 then '1500530855697-b586d89ba3ee'
          else '1517048676732-d65bc937f952'
        end || '?auto=format&fit=crop&w=720&q=80',
      'seed/voice-video-room-' || idx || '.jpg',
      now() - ((idx * 3) || ' hours')::interval,
      case when idx <= 6 then now() - ((idx * 7) || ' minutes')::interval else now() - ((idx * 8) || ' hours')::interval end,
      case when idx > 6 then now() - ((idx * 8 - 1) || ' hours')::interval else null end
    )
    returning id into room_id;

    insert into voice_video_room_participants (room_id, user_id, role, joined_at, left_at, status, created_at)
    values (
      room_id,
      room_host_id,
      'host',
      coalesce((select started_at from voice_video_rooms where id = room_id), now() - interval '15 minutes'),
      case when idx > 6 then now() - ((idx * 8 - 1) || ' hours')::interval else null end,
      case when idx > 6 then 'left' else 'joined' end,
      now() - ((idx * 3) || ' hours')::interval
    )
    returning id into room_participant_id;

    insert into voice_video_room_sessions (
      room_id, user_id, participant_id, livekit_identity, started_at, ended_at, duration_seconds, billed_minutes, status
    )
    values (
      room_id,
      room_host_id,
      room_participant_id,
      'seed-room-' || idx || '-host',
      coalesce((select started_at from voice_video_rooms where id = room_id), now() - interval '15 minutes'),
      case when idx > 6 then now() - ((idx * 8 - 1) || ' hours')::interval else coalesce((select started_at from voice_video_rooms where id = room_id), now() - interval '15 minutes') + interval '3 minutes' end,
      case when idx > 6 then 300 else 180 end,
      case when idx > 6 then 5 else 3 end,
      'completed'
    )
    returning id into room_session_id;

    for room_guest_id in
      select id
        from users
       where id <> room_host_id
         and target_language = (select target_language from users where id = room_host_id)
       order by display_name
       limit (1 + (idx % 3))
    loop
      insert into voice_video_room_participants (room_id, user_id, role, joined_at, left_at, status, created_at)
      values (
        room_id,
        room_guest_id,
        'participant',
        coalesce((select started_at from voice_video_rooms where id = room_id), now() - interval '15 minutes') + interval '2 minutes',
        case when idx > 6 then now() - ((idx * 8 - 1) || ' hours')::interval else null end,
        case when idx > 6 then 'left' else 'joined' end,
        now() - ((idx * 3) || ' hours')::interval
      )
      returning id into room_participant_id;

      insert into voice_video_room_sessions (
        room_id, user_id, participant_id, livekit_identity, started_at, ended_at, duration_seconds, billed_minutes, status
      )
      values (
        room_id,
        room_guest_id,
        room_participant_id,
        'seed-room-' || idx || '-' || room_guest_id::text,
        coalesce((select started_at from voice_video_rooms where id = room_id), now() - interval '15 minutes') + interval '2 minutes',
        case when idx > 6 then now() - ((idx * 8 - 1) || ' hours')::interval else coalesce((select started_at from voice_video_rooms where id = room_id), now() - interval '15 minutes') + interval '4 minutes' end,
        case when idx > 6 then 240 else 180 end,
        case when idx > 6 then 4 else 3 end,
        'completed'
      )
      returning id into room_session_id;
    end loop;
  end loop;

  for teacher_user_id in
    select id from users order by display_name limit 8
  loop
    idx := idx + 1;
    insert into teacher_subscriptions (
      user_id, plan_key, status, stripe_customer_id, stripe_subscription_id, current_period_end, created_at, updated_at
    )
    values (
      teacher_user_id,
      'teacher',
      'active',
      'cus_seed_' || replace(teacher_user_id::text, '-', ''),
      'sub_seed_' || replace(teacher_user_id::text, '-', ''),
      now() + interval '24 days',
      now() - interval '20 days',
      now() - interval '2 days'
    );

    insert into teacher_profiles (
      user_id, display_name, headline, bio, teaching_style, experience_summary, certifications,
      native_language, timezone, country, professional_tutor, speaking_practice_only, hourly_rate_usd, trial_rate_usd,
      min_lesson_minutes, max_lesson_minutes, group_lesson_enabled, group_max_students,
      video_intro_url, video_provider, image_url, image_file_id, status, created_at, updated_at
    )
    values (
      teacher_user_id,
      (select display_name from users where id = teacher_user_id),
      case (select target_language from users where id = teacher_user_id)
        when 'ja-JP' then 'Practical Japanese through guided conversation and phrase repair'
        when 'es-ES' then 'Warm Spanish conversation practice for travel and cafes'
        when 'fr-FR' then 'Gentle French lessons for weekend-life conversations'
        when 'ko-KR' then 'Korean study partner for speaking, listening, and recall'
        else 'Conversation lessons built around useful phrases'
      end,
      'I teach with live conversation, concrete correction, and repeatable phrases. Each lesson ends with a small practice plan the student can use right away.',
      'Low-pressure speaking, quick pronunciation feedback, roleplay, and one focused correction at a time.',
      'More than 800 online language sessions taught across travel, workplace, exam-prep, and daily-life topics.',
      'LinguaStories verified teacher profile. Conversation coaching, CEFR-aligned feedback, and live classroom facilitation.',
      (select native_language from users where id = teacher_user_id),
      case idx % 4 when 0 then 'Asia/Tokyo' when 1 then 'America/New_York' when 2 then 'Europe/Paris' else 'Asia/Seoul' end,
      case idx % 4 when 0 then 'Japan' when 1 then 'United States' when 2 then 'France' else 'South Korea' end,
      idx % 3 <> 0,
      idx % 3 = 0,
      16 + (idx * 3),
      8 + idx,
      30,
      case when idx % 3 = 0 then 90 else 60 end,
      idx % 2 = 0,
      case when idx % 2 = 0 then 4 else 1 end,
      case when idx % 2 = 0 then 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' else 'https://vimeo.com/76979871' end,
      case when idx % 2 = 0 then 'youtube' else 'vimeo' end,
      'https://images.unsplash.com/photo-' ||
        case idx % 8
          when 0 then '1494790108377-be9c29b29330'
          when 1 then '1500648767791-00dcc994a43e'
          when 2 then '1517841905240-472988babdf9'
          when 3 then '1544005313-94ddf0286df2'
          when 4 then '1527980965255-d3b416303d12'
          when 5 then '1506794778202-cad84cf45f1d'
          when 6 then '1547425260-76bcadfb4f2c'
          else '1531123897727-8f129e1688ce'
        end || '?auto=format&fit=crop&w=520&q=80',
      'seed/teacher-profile-' || idx || '.jpg',
      'published',
      now() - ((idx * 4) || ' days')::interval,
      now() - ((idx * 2) || ' hours')::interval
    )
    returning id into teacher_profile_id;

    insert into teacher_profile_languages (teacher_profile_id, language, role, cefr_level)
    values
      (teacher_profile_id, (select target_language from users where id = teacher_user_id), 'teaches', case idx % 6 when 0 then 'A1' when 1 then 'A2' when 2 then 'B1' when 3 then 'B2' when 4 then 'C1' else 'C2' end),
      (teacher_profile_id, (select native_language from users where id = teacher_user_id), 'speaks', 'Native'),
      (teacher_profile_id, 'en-US', 'speaks', 'C1')
    on conflict do nothing;

    insert into teacher_profile_tags (teacher_profile_id, tag)
    values
      (teacher_profile_id, 'conversation'),
            (teacher_profile_id, 'pronunciation'),
      (teacher_profile_id, case idx % 4 when 0 then 'travel' when 1 then 'workplace' when 2 then 'exam prep' else 'daily life' end)
    on conflict do nothing;

    insert into teacher_lesson_settings (
      teacher_profile_id, trial_enabled, one_on_one_enabled, group_enabled, supported_durations, buffer_minutes, advance_notice_hours
    )
    values (teacher_profile_id, true, true, idx % 2 = 0, array[30, 45, 60], 10 + (idx % 3) * 5, 6 + (idx % 4) * 3);

    insert into teacher_booking_rules (
      teacher_user_id, teacher_profile_id, min_booking_notice_minutes, max_advance_booking_days,
      buffer_before_minutes, buffer_after_minutes, cancellation_cutoff_minutes, reschedule_cutoff_minutes,
      supported_durations
    )
    values (
      teacher_user_id, teacher_profile_id, (6 + (idx % 4) * 3) * 60, 30,
      10 + (idx % 3) * 5, 10 + (idx % 3) * 5, 720, 720, array[30, 45, 60]
    )
    on conflict on constraint teacher_booking_rules_teacher_profile_id_key do update
      set min_booking_notice_minutes = excluded.min_booking_notice_minutes,
          buffer_before_minutes = excluded.buffer_before_minutes,
          buffer_after_minutes = excluded.buffer_after_minutes,
          supported_durations = excluded.supported_durations,
          updated_at = now();

    insert into teacher_availability_rules (teacher_profile_id, weekday, start_time, end_time, timezone)
    values
      (teacher_profile_id, 1, '09:00', '12:00', 'UTC'),
      (teacher_profile_id, 3, '18:00', '21:00', 'UTC'),
      (teacher_profile_id, 6, '10:00', '14:00', 'UTC');

    insert into teacher_unavailable_blocks (teacher_profile_id, teacher_user_id, title, starts_at, ends_at, timezone, reason)
    values (teacher_profile_id, teacher_user_id, 'Vacation block', now() + interval '9 days', now() + interval '9 days 3 hours', 'UTC', 'Seeded vacation block');

    insert into teacher_resources (teacher_user_id, teacher_profile_id, title, resource_type, url, body, visibility)
    values
      (teacher_user_id, teacher_profile_id, 'First lesson phrase sheet', 'link', 'https://example.com/resources/first-lesson', 'Starter prompts for a focused first lesson.', 'lesson_students'),
      (teacher_user_id, teacher_profile_id, 'Correction symbols', 'text', null, 'Underline the phrase to repeat. Star the phrase to save. Circle the sound to shadow.', 'teacher_only');

    select id into teacher_resource_id
      from teacher_resources
     where teacher_resources.teacher_user_id = seed_data.teacher_user_id
       and title = 'First lesson phrase sheet'
     order by created_at desc
     limit 1;

    insert into lesson_templates (teacher_user_id, teacher_profile_id, title, target_language, level, lesson_type, body)
    values
      (teacher_user_id, teacher_profile_id, 'Conversation repair practice', (select target_language from users where id = teacher_user_id), 'A2', 'one_on_one', '1. Warm-up question. 2. Student practices a real scenario. 3. Teacher repairs one phrase. 4. Student repeats and plans follow-up practice.'),
      (teacher_user_id, teacher_profile_id, 'Group roleplay rotation', (select target_language from users where id = teacher_user_id), 'B1', 'group', '1. Assign roles. 2. Rotate speaking turns. 3. Capture three useful phrases. 4. End with one speaking reflection.');

    select id into lesson_template_id
      from lesson_templates
     where lesson_templates.teacher_user_id = seed_data.teacher_user_id
       and title = 'Conversation repair practice'
     order by created_at desc
     limit 1;

    insert into lesson_template_resources (lesson_template_id, teacher_resource_id)
    values (lesson_template_id, teacher_resource_id)
    on conflict do nothing;
  end loop;

  for idx in 1..36 loop
    select tp.id, tp.user_id
      into teacher_profile_id, teacher_user_id
      from teacher_profiles tp
      order by tp.created_at, tp.display_name
      offset ((idx - 1) % greatest((select count(*) from teacher_profiles), 1))
      limit 1;

    select u.id
      into student_user_id
      from users u
     where u.id <> teacher_user_id
       and u.target_language = (select language from teacher_profile_languages tpl where tpl.teacher_profile_id = seed_data.teacher_profile_id and role = 'teaches' limit 1)
     order by u.display_name
     offset ((idx - 1) % greatest((select count(*) from users where id <> teacher_user_id), 1))
     limit 1;

    if student_user_id is null then
      select id into student_user_id from users where id <> teacher_user_id order by display_name limit 1;
    end if;

    insert into lesson_bookings (
      teacher_profile_id, teacher_user_id, student_user_id, lesson_type, title, target_language,
      starts_at, ends_at, duration_minutes, max_students, status, payment_status,
      lesson_price_usd, platform_fee_usd, total_student_charge_usd, teacher_payout_usd,
      stripe_checkout_session_id, stripe_payment_intent_id, livekit_room_name, created_at, updated_at
    )
    values (
      teacher_profile_id,
      teacher_user_id,
      student_user_id,
      case when idx % 9 = 0 then 'trial' when idx % 7 = 0 then 'group' else 'one_on_one' end,
      case idx % 5
        when 0 then 'Conversation repair lesson'
        when 1 then 'Travel roleplay lesson'
        when 2 then 'Pronunciation and speaking practice'
        when 3 then 'Practice plan review'
        else 'Conversation confidence lesson'
      end,
      (select language from teacher_profile_languages tpl where tpl.teacher_profile_id = seed_data.teacher_profile_id and role = 'teaches' limit 1),
      now() + (((idx - 18) * 10) || ' hours')::interval,
      now() + (((idx - 18) * 10 + case when idx % 3 = 0 then 90 else 60 end) || ' hours')::interval,
      case when idx % 3 = 0 then 90 else 60 end,
      case when idx % 7 = 0 then 4 else 1 end,
      case when idx < 18 then 'completed' when idx = 18 then 'active' when idx % 11 = 0 then 'cancelled_by_student' when idx % 5 = 0 then 'pending_payment' else 'confirmed' end,
      case when idx % 5 = 0 then 'pending' when idx % 11 = 0 then 'refunded' else 'paid' end,
      18 + (idx % 8) * 4,
      0.50,
      18.50 + (idx % 8) * 4,
      18 + (idx % 8) * 4,
      'cs_seed_' || idx,
      case when idx % 5 = 0 then null else 'pi_seed_' || idx end,
      'seed-classroom-' || idx,
      now() - ((idx + 3) || ' days')::interval,
      now() - ((idx % 5) || ' hours')::interval
    )
    returning id into lesson_id;

    insert into lesson_participants (lesson_booking_id, user_id, role, joined_at, left_at)
    values
      (seed_data.lesson_id, seed_data.teacher_user_id, 'teacher', case when idx <= 18 then (select lb.starts_at from lesson_bookings lb where lb.id = seed_data.lesson_id) else null end, case when idx < 18 then (select lb.ends_at from lesson_bookings lb where lb.id = seed_data.lesson_id) else null end),
      (seed_data.lesson_id, seed_data.student_user_id, 'student', case when idx <= 18 then (select lb.starts_at from lesson_bookings lb where lb.id = seed_data.lesson_id) + interval '3 minutes' else null end, case when idx < 18 then (select lb.ends_at from lesson_bookings lb where lb.id = seed_data.lesson_id) else null end);

    insert into lesson_payments (
      lesson_booking_id, student_user_id, teacher_user_id, lesson_price_usd, platform_fee_usd,
      total_student_charge_usd, teacher_payout_usd, status, stripe_checkout_session_id, stripe_payment_intent_id
    )
    select lb.id, lb.student_user_id, lb.teacher_user_id, lb.lesson_price_usd, lb.platform_fee_usd,
           lb.total_student_charge_usd, lb.teacher_payout_usd,
           case when lb.payment_status = 'paid' then 'paid' when lb.payment_status = 'refunded' then 'refunded' else 'pending' end,
           lb.stripe_checkout_session_id, lb.stripe_payment_intent_id
      from lesson_bookings lb
     where lb.id = seed_data.lesson_id;

    insert into classroom_sessions (lesson_booking_id, livekit_room_name, started_by_user_id, started_at, ended_at, status)
    select lb.id,
           lb.livekit_room_name,
           case when lb.status in ('active', 'completed') then lb.teacher_user_id else null end,
           case when lb.status in ('active', 'completed') then lb.starts_at else null end,
           case when lb.status = 'completed' then lb.ends_at else null end,
           case when lb.status = 'active' then 'active' when lb.status = 'completed' then 'ended' else 'scheduled' end
      from lesson_bookings lb
     where lb.id = seed_data.lesson_id;

    update teacher_student_relationships tsr
       set last_lesson_at = greatest(tsr.last_lesson_at, (select lb.starts_at from lesson_bookings lb where lb.id = seed_data.lesson_id)),
           total_lessons = tsr.total_lessons + 1,
           updated_at = now()
     where tsr.teacher_profile_id = seed_data.teacher_profile_id
       and tsr.student_user_id = seed_data.student_user_id;

    if not found then
      insert into teacher_student_relationships (
        teacher_profile_id, teacher_user_id, student_user_id, first_lesson_at, last_lesson_at, total_lessons
      )
      values (
        seed_data.teacher_profile_id, seed_data.teacher_user_id, seed_data.student_user_id,
        (select lb.starts_at from lesson_bookings lb where lb.id = seed_data.lesson_id),
        (select lb.starts_at from lesson_bookings lb where lb.id = seed_data.lesson_id),
        1
      );
    end if;

    insert into lesson_notes (lesson_booking_id, author_user_id, visibility, body, created_at)
    values
      (seed_data.lesson_id, seed_data.teacher_user_id, 'shared', 'Shared note: practice the repaired phrase three times before the next lesson.', now() - interval '2 hours'),
      (seed_data.lesson_id, seed_data.teacher_user_id, 'teacher_private', 'Private note: student responds well to roleplay before correction.', now() - interval '90 minutes'),
      (seed_data.lesson_id, seed_data.student_user_id, 'shared', 'Student note: practice the travel phrase out loud before the next lesson.', now() - interval '1 hour');

    insert into teacher_private_notes (teacher_user_id, student_user_id, lesson_booking_id, body, created_at)
    values (seed_data.teacher_user_id, seed_data.student_user_id, seed_data.lesson_id, 'Seeded CRM-style note: prefers gentle pacing and concrete examples.', now() - interval '80 minutes');

    if idx <= 18 then
      insert into teacher_reviews (teacher_profile_id, lesson_booking_id, student_user_id, rating, body, created_at)
      values (
        seed_data.teacher_profile_id,
        seed_data.lesson_id,
        seed_data.student_user_id,
        4 + (idx % 2),
        'Clear corrections, useful notes, and a friendly classroom pace.',
        now() - interval '30 minutes'
      );

      insert into teacher_payouts (teacher_user_id, lesson_booking_id, amount_usd, status, stripe_transfer_id)
      select lb.teacher_user_id,
             lb.id,
             lb.teacher_payout_usd,
             case when idx % 5 = 0 then 'pending' else 'paid' end,
             case when idx % 5 = 0 then null else 'tr_seed_' || idx end
        from lesson_bookings lb
       where lb.id = seed_data.lesson_id;
    end if;

    insert into direct_conversations (
      participant_one, participant_two, conversation_type, teacher_profile_id, lesson_booking_id, created_at, updated_at
    )
    values (seed_data.teacher_user_id, seed_data.student_user_id, 'teacher_student', seed_data.teacher_profile_id, seed_data.lesson_id, now() - interval '2 days', now() - interval '30 minutes')
    on conflict do nothing;

    select id into conversation_id
      from direct_conversations
     where least(participant_one::text, participant_two::text) = least(seed_data.teacher_user_id::text, seed_data.student_user_id::text)
       and greatest(participant_one::text, participant_two::text) = greatest(seed_data.teacher_user_id::text, seed_data.student_user_id::text)
     limit 1;

    update direct_conversations
       set conversation_type = 'teacher_student',
           teacher_profile_id = coalesce(seed_data.teacher_profile_id, direct_conversations.teacher_profile_id),
           lesson_booking_id = coalesce(seed_data.lesson_id, direct_conversations.lesson_booking_id),
           updated_at = now() - interval '30 minutes'
     where id = seed_data.conversation_id;

    insert into direct_messages (
      conversation_id, sender_id, recipient_id, body, message_context, read_at, created_at
    )
    values
      (seed_data.conversation_id, seed_data.student_user_id, seed_data.teacher_user_id, 'Hi, I booked this because I want help turning study notes into speaking practice.', 'teacher_student', now() - interval '45 minutes', now() - interval '2 days'),
      (seed_data.conversation_id, seed_data.teacher_user_id, seed_data.student_user_id, 'Perfect. Bring one phrase you want to use naturally, and we will repair it together.', 'teacher_student', now() - interval '20 minutes', now() - interval '1 day'),
      (seed_data.conversation_id, seed_data.student_user_id, seed_data.teacher_user_id, 'Got it. I will bring a travel phrase and a pronunciation question.', 'teacher_student', null, now() - interval '30 minutes');
  end loop;
end $$;

insert into user_accounts (
  user_id, subscription_tier, account_state, billing_status, subscription_status,
  subscription_start_date, renewal_date, payment_provider_customer_id, payment_provider_subscription_id,
  created_at, updated_at
)
select
  u.id,
  case when ts.plan_key = 'teacher' then 'teacher' else 'free' end,
  'active',
  case when ts.plan_key is null then 'none' else 'active' end,
  case when ts.plan_key is null then 'none' else 'active' end,
  u.created_at,
  ts.current_period_end,
  ts.stripe_customer_id,
  ts.stripe_subscription_id,
  u.created_at,
  now()
from users u
left join lateral (
  select plan_key, stripe_customer_id, stripe_subscription_id, current_period_end
    from teacher_subscriptions
   where teacher_subscriptions.user_id = u.id
     and teacher_subscriptions.status in ('active', 'past_due', 'incomplete')
   order by updated_at desc
   limit 1
) ts on true
on conflict (user_id) do update
set subscription_tier = excluded.subscription_tier,
    account_state = excluded.account_state,
    billing_status = excluded.billing_status,
    subscription_status = excluded.subscription_status,
    renewal_date = excluded.renewal_date,
    payment_provider_customer_id = excluded.payment_provider_customer_id,
    payment_provider_subscription_id = excluded.payment_provider_subscription_id,
    updated_at = now();

commit;
