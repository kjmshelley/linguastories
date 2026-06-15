const crypto = require("crypto");
const { pool } = require("../src/db/pool");

function usage() {
  return [
    "Usage:",
    "  node scripts/schedule-class-now.js --id <lesson-booking-id>",
    "  node scripts/schedule-class-now.js <lesson-booking-id>",
    "",
    "Optional:",
    "  --minutes <15|30|45|60|90>"
  ].join("\n");
}

function valueFromArgs(argv, names) {
  const index = argv.findIndex((arg) => names.includes(arg));
  return index === -1 ? "" : argv[index + 1] || "";
}

function bookingIdFromArgs(argv) {
  return valueFromArgs(argv, ["--id", "--booking-id", "--lesson-booking-id"]) || argv.find((arg) => !arg.startsWith("--")) || "";
}

function minutesFromArgs(argv, fallback) {
  const raw = valueFromArgs(argv, ["--minutes", "--duration", "--duration-minutes"]);
  if (!raw) return fallback;
  const minutes = Number(raw);
  if (![15, 30, 45, 60, 90].includes(minutes)) throw new Error("Minutes must be one of: 15, 30, 45, 60, 90");
  return minutes;
}

async function main() {
  const argv = process.argv.slice(2);
  const bookingId = bookingIdFromArgs(argv);
  if (!bookingId) throw new Error(usage());

  const client = await pool.connect();
  try {
    await client.query("begin");

    const bookingResult = await client.query(
      `select id,
              teacher_profile_id,
              teacher_user_id,
              student_user_id,
              duration_minutes,
              lesson_price_usd,
              platform_fee_usd,
              total_student_charge_usd,
              teacher_payout_usd,
              livekit_room_name
         from lesson_bookings
        where id = $1
        for update`,
      [bookingId]
    );
    const booking = bookingResult.rows[0];
    if (!booking) throw new Error(`Lesson booking not found: ${bookingId}`);

    const durationMinutes = minutesFromArgs(argv, Number(booking.duration_minutes || 30));
    const livekitRoomName = booking.livekit_room_name || `linguastories-classroom-${crypto.randomUUID()}`;

    const updated = await client.query(
      `update lesson_bookings
          set starts_at = now(),
              ends_at = now() + ($2::int * interval '1 minute'),
              duration_minutes = $2,
              status = 'confirmed',
              payment_status = 'paid',
              payment_expires_at = null,
              livekit_room_name = $3,
              updated_at = now()
        where id = $1
        returning id,
                  title,
                  status,
                  payment_status as "paymentStatus",
                  starts_at as "startsAt",
                  ends_at as "endsAt",
                  duration_minutes as "durationMinutes",
                  livekit_room_name as "livekitRoomName"`,
      [booking.id, durationMinutes, livekitRoomName]
    );

    await client.query(
      `insert into lesson_participants (lesson_booking_id, user_id, role)
       values ($1, $2, 'teacher'), ($1, $3, 'student')
       on conflict (lesson_booking_id, user_id) do update
          set role = excluded.role`,
      [booking.id, booking.teacher_user_id, booking.student_user_id]
    );

    await client.query(
      `insert into classroom_sessions (lesson_booking_id, livekit_room_name, status)
       select $1, $2, 'scheduled'
        where not exists (
          select 1 from classroom_sessions where lesson_booking_id = $1
        )`,
      [booking.id, livekitRoomName]
    );

    await client.query(
      `update classroom_sessions
          set livekit_room_name = $2,
              status = 'scheduled',
              started_by_user_id = null,
              started_at = null,
              ended_at = null
        where lesson_booking_id = $1`,
      [booking.id, livekitRoomName]
    );

    const paymentUpdate = await client.query(
      `update lesson_payments
          set status = 'paid',
              student_user_id = $2,
              teacher_user_id = $3,
              lesson_price_usd = $4,
              platform_fee_usd = $5,
              total_student_charge_usd = $6,
              teacher_payout_usd = $7,
              updated_at = now()
        where lesson_booking_id = $1`,
      [
        booking.id,
        booking.student_user_id,
        booking.teacher_user_id,
        booking.lesson_price_usd,
        booking.platform_fee_usd,
        booking.total_student_charge_usd,
        booking.teacher_payout_usd
      ]
    );

    if (!paymentUpdate.rowCount) {
      await client.query(
        `insert into lesson_payments (
         lesson_booking_id,
         student_user_id,
         teacher_user_id,
         lesson_price_usd,
         platform_fee_usd,
         total_student_charge_usd,
         teacher_payout_usd,
         status
       )
       values ($1, $2, $3, $4, $5, $6, $7, 'paid')`,
        [
          booking.id,
          booking.student_user_id,
          booking.teacher_user_id,
          booking.lesson_price_usd,
          booking.platform_fee_usd,
          booking.total_student_charge_usd,
          booking.teacher_payout_usd
        ]
      );
    }

    await client.query("commit");

    const row = updated.rows[0];
    console.log(`Scheduled lesson booking ${row.id} for now`);
    console.log(`Title: ${row.title}`);
    console.log(`Status: ${row.status}`);
    console.log(`Payment: ${row.paymentStatus}`);
    console.log(`Starts at: ${row.startsAt.toISOString()}`);
    console.log(`Ends at: ${row.endsAt.toISOString()}`);
    console.log(`Duration: ${row.durationMinutes} minutes`);
    console.log(`LiveKit room: ${row.livekitRoomName}`);
  } catch (error) {
    await client.query("rollback").catch(() => null);
    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
