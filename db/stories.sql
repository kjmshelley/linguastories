BEGIN;

WITH new_story AS (
  INSERT INTO stories (
    title,
    source_language,
    topic,
    unlock_cost,
    reward_coins
  )
  VALUES (
    'First Introductions',
    'English',
    'Introductions/Greetings',
    20,
    15
  )
  RETURNING id
),
translations AS (
  SELECT * FROM (
    VALUES

    (
      'English',
      'A1',
      'First Introductions',
$txt$
My name is Tom.

I am from Taiwan.

I am a teacher.

I like books.

I like basketball too.

Today I am with new people.

A woman says, “Hello.”

Her name is Sarah.

She likes books.

She likes basketball too.

We talk.

We smile.

Now Sarah is my friend.

I am happy.
$txt$,
      NULL,
      NULL,
      '1 min',
      '[
        {"text":"My name is Tom.","type":"introduction"},
        {"text":"I am from Taiwan.","type":"origin"},
        {"text":"I like books.","type":"interest"},
        {"text":"Now Sarah is my friend.","type":"friendship"}
      ]'::jsonb,
      '[
        "My name is Tom.",
        "I am from Taiwan.",
        "I like books.",
        "Now Sarah is my friend."
      ]'::jsonb,
      '[
        {"word":"name","meaning":"what people call you"},
        {"word":"from","meaning":"shows where someone comes from"},
        {"word":"teacher","meaning":"a person who helps students learn"},
        {"word":"books","meaning":"things people read"},
        {"word":"basketball","meaning":"a sport"},
        {"word":"friend","meaning":"a person you like and know well"},
        {"word":"happy","meaning":"feeling good"}
      ]'::jsonb,
      '[
        "I am + name/place/job",
        "I like + noun",
        "She likes + noun",
        "Simple present tense",
        "Basic greetings"
      ]'::jsonb
    ),

    (
      'English',
      'A2',
      'First Introductions',
$txt$
My name is Tom. I am from Taiwan, and I am a teacher.

One day, I go to a class with many new people. I feel a little shy.

The teacher says, “Please tell us about yourself.”

I say, “I am Tom. I like books and basketball.”

After the class, Sarah talks to me.

She likes books and basketball too.

We talk together for a few minutes.

Now we are friends, and I feel happy.
$txt$,
      NULL,
      NULL,
      '1 min',
      '[
        {"text":"I feel a little shy.","type":"feeling"},
        {"text":"Please tell us about yourself.","type":"classroom phrase"},
        {"text":"Sarah talks to me.","type":"conversation"},
        {"text":"Now we are friends.","type":"result"}
      ]'::jsonb,
      '[
        "I go to a class with many new people.",
        "I feel a little shy.",
        "Please tell us about yourself.",
        "Now we are friends."
      ]'::jsonb,
      '[
        {"word":"class","meaning":"a place or time for learning"},
        {"word":"new people","meaning":"people you do not know yet"},
        {"word":"shy","meaning":"nervous around other people"},
        {"word":"yourself","meaning":"you as a person"},
        {"word":"talk","meaning":"speak with someone"},
        {"word":"together","meaning":"with another person"},
        {"word":"friends","meaning":"people who like and know each other"}
      ]'::jsonb,
      '[
        "Simple present tense",
        "One day for story sequence",
        "Feel + adjective",
        "After + noun",
        "And to connect ideas"
      ]'::jsonb
    ),

    (
      'English',
      'B1',
      'First Introductions',
$txt$
Tom is from Taiwan and works as a teacher. He enjoys reading books and playing basketball.

One day, he joins a class where he does not know anyone. At first, he feels nervous.

The teacher asks everyone to introduce themselves.

When it is Tom’s turn, he says, “My name is Tom. I’m from Taiwan. I’m a teacher, and I enjoy reading and basketball.”

After the introductions, a woman named Sarah talks to him.

She enjoys the same hobbies, so they have a good conversation.

By the end of the class, they become friends, and Tom feels much more comfortable.
$txt$,
      NULL,
      NULL,
      '1 min',
      '[
        {"text":"works as a teacher","type":"profession"},
        {"text":"where he does not know anyone","type":"relative clause"},
        {"text":"When it is Tom’s turn","type":"time phrase"},
        {"text":"much more comfortable","type":"comparison"}
      ]'::jsonb,
      '[
        "Tom is from Taiwan and works as a teacher.",
        "The teacher asks everyone to introduce themselves.",
        "She enjoys the same hobbies.",
        "Tom feels much more comfortable."
      ]'::jsonb,
      '[
        {"word":"works as","meaning":"has this job"},
        {"word":"enjoys","meaning":"likes doing something"},
        {"word":"joins","meaning":"becomes part of something"},
        {"word":"nervous","meaning":"worried or not relaxed"},
        {"word":"introduce","meaning":"tell people who you are"},
        {"word":"hobbies","meaning":"activities you enjoy"},
        {"word":"conversation","meaning":"a talk between people"},
        {"word":"comfortable","meaning":"relaxed and not worried"}
      ]'::jsonb,
      '[
        "Third-person simple present",
        "Enjoy + gerund",
        "Relative clause with where",
        "When clause",
        "By the end of + noun"
      ]'::jsonb
    ),

    (
      'English',
      'B2',
      'First Introductions',
$txt$
Tom, a teacher from Taiwan, decides to attend a class where he hopes to meet new people. Although he is interested in getting to know others, he feels slightly nervous when he arrives because he does not recognize anyone.

At the beginning of the session, the teacher asks each person to introduce themselves.

When Tom speaks, he shares his name, where he is from, his profession, and his interests, including reading and basketball.

Afterward, a participant named Sarah approaches him. She mentions that she enjoys many of the same activities.

Their shared interests quickly lead to an enjoyable discussion. As they continue talking, Tom becomes more relaxed and confident.

By the end of the class, they have formed a new friendship.
$txt$,
      NULL,
      NULL,
      '1 min',
      '[
        {"text":"Although he is interested","type":"contrast"},
        {"text":"slightly nervous","type":"feeling"},
        {"text":"shared interests","type":"connection"},
        {"text":"more relaxed and confident","type":"character change"}
      ]'::jsonb,
      '[
        "Tom decides to attend a class where he hopes to meet new people.",
        "Although he is interested in getting to know others, he feels slightly nervous.",
        "Their shared interests quickly lead to an enjoyable discussion.",
        "They have formed a new friendship."
      ]'::jsonb,
      '[
        {"word":"attend","meaning":"go to an event or class"},
        {"word":"recognize","meaning":"know someone or something because you have seen them before"},
        {"word":"session","meaning":"a meeting or class period"},
        {"word":"profession","meaning":"job or type of work"},
        {"word":"participant","meaning":"a person who takes part in something"},
        {"word":"approaches","meaning":"comes near to speak"},
        {"word":"discussion","meaning":"a serious or friendly talk"},
        {"word":"confident","meaning":"feeling sure about yourself"}
      ]'::jsonb,
      '[
        "Although for contrast",
        "Where relative clause",
        "Including + nouns",
        "As + subject + verb",
        "Present perfect: have formed"
      ]'::jsonb
    ),

    (
      'English',
      'C1',
      'First Introductions',
$txt$
Tom, a teacher from Taiwan, attends a local class with the goal of meeting new people and expanding his social network. While he is enthusiastic about the opportunity, he experiences some anxiety upon entering a room full of unfamiliar faces.

To help everyone get acquainted, the instructor invites each participant to introduce themselves.

When Tom’s turn arrives, he briefly describes his background, profession, and interests. He explains that he enjoys reading and playing basketball in his spare time.

Following the introductions, a woman named Sarah approaches him and remarks that they seem to have several interests in common.

What begins as a simple exchange soon develops into a meaningful conversation. As they discuss books, sports, and personal experiences, Tom feels increasingly at ease.

By the conclusion of the class, a genuine friendship has begun to form.
$txt$,
      NULL,
      NULL,
      '1 min',
      '[
        {"text":"expanding his social network","type":"purpose"},
        {"text":"unfamiliar faces","type":"description"},
        {"text":"meaningful conversation","type":"development"},
        {"text":"increasingly at ease","type":"emotional change"}
      ]'::jsonb,
      '[
        "Tom attends a local class with the goal of meeting new people.",
        "He experiences some anxiety upon entering a room full of unfamiliar faces.",
        "What begins as a simple exchange soon develops into a meaningful conversation.",
        "A genuine friendship has begun to form."
      ]'::jsonb,
      '[
        {"word":"expanding","meaning":"making something larger"},
        {"word":"social network","meaning":"the people someone knows"},
        {"word":"enthusiastic","meaning":"excited and interested"},
        {"word":"anxiety","meaning":"a worried or nervous feeling"},
        {"word":"acquainted","meaning":"knowing someone a little"},
        {"word":"remarks","meaning":"says or comments"},
        {"word":"meaningful","meaning":"important or valuable"},
        {"word":"genuine","meaning":"real and sincere"}
      ]'::jsonb,
      '[
        "With the goal of + gerund",
        "While for contrast",
        "Upon + gerund",
        "What begins as... develops into...",
        "Present perfect: has begun to form"
      ]'::jsonb
    ),

    (
      'English',
      'C2',
      'First Introductions',
$txt$
Tom, a teacher originally from Taiwan, attends a community learning program in the hope of broadening his social connections and engaging with people outside his usual circle. Although he looks forward to the experience, he is conscious of a lingering sense of uncertainty as he enters an environment where everyone is unfamiliar.

As part of the opening activity, the facilitator invites attendees to introduce themselves.

When Tom speaks, he offers a concise overview of his background, professional life, and personal interests, mentioning his enthusiasm for reading and basketball.

Among the attendees is Sarah, who later approaches him and notes the striking similarities between their interests.

Their initial exchange evolves naturally into a thoughtful and engaging conversation. Through their discussion, they discover several shared perspectives and experiences, creating an immediate sense of rapport.

By the end of the session, Tom leaves not only with increased confidence but also with the beginnings of a meaningful new friendship.
$txt$,
      NULL,
      NULL,
      '1 min',
      '[
        {"text":"broadening his social connections","type":"advanced purpose phrase"},
        {"text":"lingering sense of uncertainty","type":"nuanced emotion"},
        {"text":"striking similarities","type":"emphasis"},
        {"text":"immediate sense of rapport","type":"relationship development"}
      ]'::jsonb,
      '[
        "Tom attends a community learning program in the hope of broadening his social connections.",
        "He is conscious of a lingering sense of uncertainty.",
        "Their initial exchange evolves naturally into a thoughtful and engaging conversation.",
        "Tom leaves not only with increased confidence but also with the beginnings of a meaningful new friendship."
      ]'::jsonb,
      '[
        {"word":"broadening","meaning":"expanding or increasing"},
        {"word":"engaging with","meaning":"interacting with"},
        {"word":"usual circle","meaning":"the people someone normally spends time with"},
        {"word":"lingering","meaning":"continuing for some time"},
        {"word":"facilitator","meaning":"a person who guides a group activity"},
        {"word":"concise","meaning":"short but clear"},
        {"word":"striking","meaning":"very noticeable"},
        {"word":"rapport","meaning":"a friendly connection between people"}
      ]'::jsonb,
      '[
        "In the hope of + gerund",
        "Although for concession",
        "Where relative clause",
        "Among the attendees is...",
        "Not only... but also...",
        "Participial phrase: creating an immediate sense of rapport"
      ]'::jsonb
    )

  ) AS t(
    target_language,
    level,
    title,
    text,
    source_text,
    romanization,
    reading_time,
    highlights,
    key_sentences,
    key_words,
    grammar_points
  )
)

INSERT INTO story_translations (
  story_id,
  target_language,
  level,
  title,
  text,
  source_text,
  romanization,
  reading_time,
  highlights,
  key_sentences,
  key_words,
  grammar_points
)
SELECT
  ns.id,
  t.target_language,
  t.level,
  t.title,
  t.text,
  t.source_text,
  t.romanization,
  t.reading_time,
  t.highlights,
  t.key_sentences,
  t.key_words,
  t.grammar_points
FROM new_story ns
CROSS JOIN translations t;

COMMIT;
