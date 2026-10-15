insert into users (display_name, email, password_hash, avatar, native_language, target_language, site_language)
values (
  'Mika Tan',
  'demo@linguastories.local',
  'pbkdf2_sha256$310000$linguastories-demo-salt$4dcf782c48e2ddcfca5e2fc7babb9ecaf14ed4318768aea46ee4be4b0992b75d',
  'MT',
  'en-US',
  'zh-TW',
  'en-US'
)
on conflict (email) do nothing;
