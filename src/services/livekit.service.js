const crypto = require("crypto");
const { pool, query } = require("../db/pool");
const storageService = require("./storage.service");

const SESSION_LIMIT_SECONDS = 6 * 60;
const COINS_PER_MINUTE = 1000;
const MIN_JOIN_COINS = 1000;
const TOKEN_TTL_SECONDS = 7 * 60;
const CEFR_LEVELS = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);
const ROOM_TYPES = new Set(["voice", "video"]);
const MAX_ROOM_PARTICIPANTS = 4;

function badRequest(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function cleanText(value, { fallback = "", max = 255 } = {}) {
  return String(value ?? fallback).trim().replace(/\s+/g, " ").slice(0, max);
}

function normalizeRoomType(value) {
  const roomType = String(value || "voice").toLowerCase();
  if (!ROOM_TYPES.has(roomType)) throw badRequest("Choose voice or video");
  return roomType;
}

function normalizeLevel(value) {
  const level = String(value || "A1").toUpperCase();
  if (!CEFR_LEVELS.has(level)) throw badRequest("Choose a valid CEFR level");
  return level;
}

function normalizeBoolean(value) {
  return value === true || String(value).toLowerCase() === "true";
}

function publicRoomSql() {
  return `(
    r.is_private = false
    or r.owner_user_id = $1
    or exists (
      select 1
        from voice_video_room_participants access_participant
       where access_participant.room_id = r.id
         and access_participant.user_id = $1
    )
  )`;
}

function mapRoom(row) {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    ownerName: row.ownerName || "Learner",
    title: row.title,
    description: row.description || "",
    roomType: row.roomType,
    targetLanguage: row.targetLanguage,
    sourceLanguage: row.sourceLanguage,
    cefrLevel: row.cefrLevel,
    maxParticipants: row.maxParticipants,
    isPrivate: row.isPrivate,
    status: row.status,
    imageUrl: row.imageUrl || "",
    participantCount: Number(row.participantCount || 0),
    hostActive: Boolean(row.hostActive),
    createdAt: row.createdAt,
    costPerMinute: COINS_PER_MINUTE,
    maxMinutes: 6,
    maxCost: COINS_PER_MINUTE * 6
  };
}

function mapSession(row) {
  if (!row) return null;
  const startedAt = new Date(row.startedAt);
  const elapsedSeconds = row.status === "active"
    ? Math.min(SESSION_LIMIT_SECONDS, Math.max(0, Math.ceil((Date.now() - startedAt.getTime()) / 1000)))
    : Number(row.durationSeconds || 0);
  return {
    id: row.id,
    roomId: row.roomId,
    startedAt: row.startedAt,
    endedAt: row.endedAt || null,
    status: row.status,
    durationSeconds: Number(row.durationSeconds || elapsedSeconds),
    elapsedSeconds,
    secondsRemaining: Math.max(0, SESSION_LIMIT_SECONDS - elapsedSeconds),
    billedMinutes: Number(row.billedMinutes || Math.ceil(Math.max(1, elapsedSeconds) / 60)),
    coinsCharged: Number(row.coinsCharged || 0)
  };
}

async function uploadRoomImage(userId, payload) {
  if (!payload.imageDataUrl) return null;
  return storageService.uploadVoiceVideoRoomImage({
    userId,
    fileName: payload.imageFileName || "voice-video-room.webp",
    dataUrl: payload.imageDataUrl
  });
}

async function createRoom(user, payload) {
  const wallet = await query(`select balance from wallets where user_id = $1`, [user.id]);
  if (Number(wallet.rows[0]?.balance || 0) < MIN_JOIN_COINS) {
    throw badRequest("You need at least 1000 coins to create a voice/video room.", 402);
  }

  const activeRooms = await query(
    `select count(*)::int as count
       from voice_video_rooms
      where owner_user_id = $1
        and status = 'active'
        and created_at > now() - interval '1 hour'`,
    [user.id]
  );
  if (Number(activeRooms.rows[0]?.count || 0) >= 3) {
    throw badRequest("You can create up to 3 active rooms per hour.", 429);
  }

  const title = cleanText(payload.title, { max: 120 });
  if (title.length < 3) throw badRequest("Room title is required");
  const description = cleanText(payload.description, { max: 1000 });
  const roomType = normalizeRoomType(payload.roomType);
  const targetLanguage = cleanText(payload.targetLanguage || user.targetLanguage || "Japanese", { max: 80 });
  const sourceLanguage = cleanText(payload.sourceLanguage || "English", { max: 80 });
  const cefrLevel = normalizeLevel(payload.cefrLevel);
  const maxParticipants = Math.min(MAX_ROOM_PARTICIPANTS, Math.max(2, Number(payload.maxParticipants || MAX_ROOM_PARTICIPANTS)));
  const image = await uploadRoomImage(user.id, payload);
  const livekitRoomName = `linguastories-${crypto.randomUUID()}`;

  const result = await query(
    `insert into voice_video_rooms (
       owner_user_id, title, description, room_type, target_language, source_language,
       cefr_level, max_participants, is_private, livekit_room_name, image_url, image_file_id
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     returning id,
               owner_user_id as "ownerUserId",
               $13::text as "ownerName",
               title,
               description,
               room_type as "roomType",
               target_language as "targetLanguage",
               source_language as "sourceLanguage",
               cefr_level as "cefrLevel",
               max_participants as "maxParticipants",
               is_private as "isPrivate",
               status,
               image_url as "imageUrl",
               created_at as "createdAt",
               0::int as "participantCount",
               false as "hostActive"`,
    [user.id, title, description, roomType, targetLanguage, sourceLanguage, cefrLevel, maxParticipants, normalizeBoolean(payload.isPrivate), livekitRoomName, image?.url || null, image?.boxFileId || null, user.displayName || "Learner"]
  );

  return { room: mapRoom(result.rows[0]) };
}

async function listRooms(user, filters = {}) {
  const values = [user.id];
  const where = ["r.status = 'active'", publicRoomSql()];
  const addFilter = (sql, value) => {
    if (!value) return;
    values.push(value);
    where.push(sql.replace("?", `$${values.length}`));
  };

  addFilter(`r.target_language = ?`, cleanText(filters.targetLanguage, { max: 80 }));
  addFilter(`r.source_language = ?`, cleanText(filters.sourceLanguage, { max: 80 }));
  addFilter(`r.cefr_level = ?`, filters.cefrLevel && normalizeLevel(filters.cefrLevel));
  addFilter(`r.room_type = ?`, filters.roomType && normalizeRoomType(filters.roomType));
  const q = cleanText(filters.q, { max: 120 });
  if (q) {
    values.push(`%${q}%`);
    where.push(`(r.title ilike $${values.length} or r.description ilike $${values.length})`);
  }

  const result = await query(
    `select r.id,
            r.owner_user_id as "ownerUserId",
            coalesce(u.display_name, 'Learner') as "ownerName",
            r.title,
            r.description,
            r.room_type as "roomType",
            r.target_language as "targetLanguage",
            r.source_language as "sourceLanguage",
            r.cefr_level as "cefrLevel",
            r.max_participants as "maxParticipants",
            r.is_private as "isPrivate",
            r.status,
            r.image_url as "imageUrl",
            r.created_at as "createdAt",
            count(p.id) filter (where p.status = 'joined')::int as "participantCount",
            bool_or(p.role = 'host' and p.status = 'joined') as "hostActive"
       from voice_video_rooms r
       left join users u on u.id = r.owner_user_id
       left join voice_video_room_participants p on p.room_id = r.id
      where ${where.join(" and ")}
      group by r.id, u.display_name
      order by r.created_at desc
      limit 80`,
    values
  );
  return { rooms: result.rows.map(mapRoom) };
}

async function getRoom(user, roomId) {
  const result = await query(
    `select r.id,
            r.owner_user_id as "ownerUserId",
            coalesce(u.display_name, 'Learner') as "ownerName",
            r.title,
            r.description,
            r.room_type as "roomType",
            r.target_language as "targetLanguage",
            r.source_language as "sourceLanguage",
            r.cefr_level as "cefrLevel",
            r.max_participants as "maxParticipants",
            r.is_private as "isPrivate",
            r.status,
            r.image_url as "imageUrl",
            r.created_at as "createdAt",
            count(p.id) filter (where p.status = 'joined')::int as "participantCount",
            bool_or(p.role = 'host' and p.status = 'joined') as "hostActive"
       from voice_video_rooms r
       left join users u on u.id = r.owner_user_id
       left join voice_video_room_participants p on p.room_id = r.id
      where r.id = $2 and ${publicRoomSql()}
      group by r.id, u.display_name`,
    [user.id, roomId]
  );
  if (!result.rows.length) throw badRequest("Room not found", 404);

  const participants = await query(
    `select p.id,
            p.user_id as "userId",
            coalesce(u.display_name, 'Learner') as "displayName",
            p.role,
            p.joined_at as "joinedAt",
            p.status
       from voice_video_room_participants p
       left join users u on u.id = p.user_id
      where p.room_id = $1
        and p.status = 'joined'
      order by p.joined_at asc`,
    [roomId]
  );

  return { room: mapRoom(result.rows[0]), participants: participants.rows };
}

function requireLiveKitConfig() {
  const missing = ["LIVEKIT_API_KEY", "LIVEKIT_API_SECRET", "LIVEKIT_URL"].filter((name) => !process.env[name]);
  if (missing.length) throw badRequest(`Missing LiveKit env vars: ${missing.join(", ")}`, 500);
}

function livekitSdk() {
  try {
    return require("livekit-server-sdk");
  } catch (_error) {
    throw badRequest("LiveKit server SDK is not installed. Run npm install before joining rooms.", 500);
  }
}

function buildToken({ room, user, session }) {
  requireLiveKitConfig();
  const { AccessToken, TrackSource } = livekitSdk();
  const token = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: session.livekitIdentity,
    name: user.displayName || "Learner",
    ttl: TOKEN_TTL_SECONDS
  });
  const publishSources = room.roomType === "voice"
    ? [TrackSource.MICROPHONE]
    : [TrackSource.CAMERA, TrackSource.MICROPHONE];
  token.addGrant({
    roomJoin: true,
    room: room.livekitRoomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: false,
    canUpdateOwnMetadata: false,
    canPublishSources: publishSources
  });
  return token.toJwt();
}

async function deleteLiveKitCloudRoom(roomName) {
  if (!roomName) return;
  try {
    requireLiveKitConfig();
    const { RoomServiceClient } = livekitSdk();
    const livekitUrl = process.env.LIVEKIT_URL.replace(/^ws/, "http");
    const client = new RoomServiceClient(livekitUrl, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
    await client.deleteRoom(roomName);
  } catch (_error) {
    // Database closure is authoritative; LiveKit room cleanup is best-effort.
  }
}

async function joinRoom(user, roomId) {
  requireLiveKitConfig();
  livekitSdk();
  const client = await pool.connect();
  try {
    await client.query("begin");
    const roomResult = await client.query(
      `select r.id,
              r.owner_user_id as "ownerUserId",
              r.title,
              r.room_type as "roomType",
              r.max_participants as "maxParticipants",
              r.livekit_room_name as "livekitRoomName",
              exists (
                select 1
                  from voice_video_room_participants host_participant
                 where host_participant.room_id = r.id
                   and host_participant.role = 'host'
                   and host_participant.status = 'joined'
              ) as "hostActive",
              r.status
         from voice_video_rooms r
        where r.id = $2
          and ${publicRoomSql()}
        for update`,
      [user.id, roomId]
    );
    const room = roomResult.rows[0];
    if (!room || room.status !== "active") throw badRequest("Room is not available", 404);
    if (room.ownerUserId !== user.id && !room.hostActive) {
      throw badRequest("The host has not started this room yet.");
    }

    const wallet = await client.query(`select balance from wallets where user_id = $1 for update`, [user.id]);
    const balance = Number(wallet.rows[0]?.balance || 0);
    if (balance < MIN_JOIN_COINS) throw badRequest("You need at least 1000 coins to join a voice/video room.", 402);

    const staleSession = await client.query(
      `select id
         from voice_video_room_sessions
        where user_id = $1
          and status = 'active'
          and started_at <= now() - interval '6 minutes'
        for update`,
      [user.id]
    );
    for (const row of staleSession.rows) {
      await endSessionWithClient(client, user.id, row.id, "timed_out");
    }

    const activeSession = await client.query(
      `select s.id,
              s.room_id as "roomId",
              s.livekit_identity as "livekitIdentity",
              s.started_at as "startedAt",
              s.ended_at as "endedAt",
              s.duration_seconds as "durationSeconds",
              s.billed_minutes as "billedMinutes",
              s.coins_charged as "coinsCharged",
              s.status
         from voice_video_room_sessions s
        where s.user_id = $1
          and s.status = 'active'
        for update`,
      [user.id]
    );
    if (activeSession.rows[0] && activeSession.rows[0].roomId !== roomId) {
      throw badRequest("You already have an active voice/video room session.");
    }

    const participantCount = await client.query(
      `select count(*)::int as count
         from voice_video_room_participants
        where room_id = $1
          and status = 'joined'`,
      [roomId]
    );
    const existingParticipant = await client.query(
      `select id
         from voice_video_room_participants
        where room_id = $1
          and user_id = $2
          and status = 'joined'
        limit 1`,
      [roomId, user.id]
    );
    if (!existingParticipant.rows.length && Number(participantCount.rows[0]?.count || 0) >= Number(room.maxParticipants)) {
      throw badRequest("This room is full.");
    }

    const participant = existingParticipant.rows[0] || (await client.query(
      `insert into voice_video_room_participants (room_id, user_id, role)
       values ($1, $2, $3)
       returning id`,
      [roomId, user.id, room.ownerUserId === user.id ? "host" : "participant"]
    )).rows[0];

    let session = activeSession.rows[0];
    if (!session) {
      const livekitIdentity = `user-${user.id}-session-${crypto.randomUUID()}`;
      session = (await client.query(
        `insert into voice_video_room_sessions (room_id, user_id, participant_id, livekit_identity)
         values ($1, $2, $3, $4)
         returning id,
                   room_id as "roomId",
                   livekit_identity as "livekitIdentity",
                   started_at as "startedAt",
                   ended_at as "endedAt",
                   duration_seconds as "durationSeconds",
                   billed_minutes as "billedMinutes",
                   coins_charged as "coinsCharged",
                   status`,
        [roomId, user.id, participant.id, livekitIdentity]
      )).rows[0];
    }
    const token = await buildToken({ room, user, session });
    await client.query("commit");
    const detail = await getRoom(user, roomId);
    return {
      ...detail,
      session: mapSession(session),
      livekitUrl: process.env.LIVEKIT_URL,
      token,
      expiresAt: new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString()
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function endSessionWithClient(client, userId, sessionId, status = "completed") {
  const sessionResult = await client.query(
    `select id,
            room_id as "roomId",
            participant_id as "participantId",
            (
              select owner_user_id
                from voice_video_rooms
               where id = voice_video_room_sessions.room_id
            ) as "ownerUserId",
            started_at as "startedAt",
            status
       from voice_video_room_sessions
      where id = $1
        and user_id = $2
      for update`,
    [sessionId, userId]
  );
  const session = sessionResult.rows[0];
  if (!session) throw badRequest("Session not found", 404);

  const existingCharge = await client.query(
    `select s.id,
            s.room_id as "roomId",
            s.started_at as "startedAt",
            s.ended_at as "endedAt",
            s.duration_seconds as "durationSeconds",
            s.billed_minutes as "billedMinutes",
            s.coins_charged as "coinsCharged",
            s.status
       from voice_video_room_sessions s
      where s.id = $1
        and s.status <> 'active'`,
    [sessionId]
  );
  if (existingCharge.rows[0]) return existingCharge.rows[0];

  const durationSeconds = Math.max(1, Math.min(SESSION_LIMIT_SECONDS, Math.ceil((Date.now() - new Date(session.startedAt).getTime()) / 1000)));
  const billedMinutes = Math.min(6, Math.max(1, Math.ceil(durationSeconds / 60)));
  const coinsCharged = billedMinutes * COINS_PER_MINUTE;
  const wallet = await client.query(`select balance from wallets where user_id = $1 for update`, [userId]);
  const balance = Number(wallet.rows[0]?.balance || 0);
  if (balance < coinsCharged) throw badRequest("Not enough coins to settle this room session.", 402);

  await client.query(
    `update wallets
        set balance = balance - $2,
            lifetime_spent = lifetime_spent + $2
      where user_id = $1`,
    [userId, coinsCharged]
  );
  await client.query(
    `insert into voice_video_room_coin_transactions (user_id, room_id, session_id, coins)
     values ($1, $2, $3, $4)
     on conflict (session_id) do nothing`,
    [userId, session.roomId, sessionId, coinsCharged]
  );
  await client.query(
    `update voice_video_room_participants
        set status = $3,
            left_at = now()
      where id = $1
        and user_id = $2
        and status = 'joined'`,
    [session.participantId, userId, status === "timed_out" ? "timed_out" : "left"]
  );
  const updated = await client.query(
    `update voice_video_room_sessions
        set status = $2,
            ended_at = now(),
            duration_seconds = $3,
            billed_minutes = $4,
            coins_charged = $5
      where id = $1
      returning id,
                room_id as "roomId",
                started_at as "startedAt",
                ended_at as "endedAt",
                duration_seconds as "durationSeconds",
                billed_minutes as "billedMinutes",
                coins_charged as "coinsCharged",
                status`,
    [sessionId, status, durationSeconds, billedMinutes, coinsCharged]
  );

  if (session.ownerUserId === userId) {
    await closeRoomAfterHostLeaves(client, session.roomId, userId);
  }
  return updated.rows[0];
}

async function closeRoomAfterHostLeaves(client, roomId, hostUserId) {
  const closedRoom = await client.query(
    `update voice_video_rooms
        set status = 'ended',
            ended_at = coalesce(ended_at, now())
      where id = $1
        and owner_user_id = $2
        and status = 'active'
      returning livekit_room_name as "livekitRoomName"`,
    [roomId, hostUserId]
  );
  const activeSessions = await client.query(
    `select id,
            user_id as "userId"
       from voice_video_room_sessions
      where room_id = $1
        and user_id <> $2
        and status = 'active'
      for update`,
    [roomId, hostUserId]
  );
  for (const row of activeSessions.rows) {
    try {
      await endSessionWithClient(client, row.userId, row.id, "disconnected");
    } catch (_error) {
      await client.query(
        `update voice_video_room_sessions
            set status = 'failed',
                ended_at = now(),
                duration_seconds = least(360, greatest(1, ceil(extract(epoch from (now() - started_at)))::int))
          where id = $1
            and status = 'active'`,
        [row.id]
      );
    }
  }
  await client.query(
    `update voice_video_room_participants
        set status = 'left',
            left_at = coalesce(left_at, now())
      where room_id = $1
        and status = 'joined'`,
    [roomId]
  );
  await deleteLiveKitCloudRoom(closedRoom.rows[0]?.livekitRoomName);
}

async function endSession(user, sessionId, status = "completed") {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const session = await endSessionWithClient(client, user.id, sessionId, status);
    await client.query("commit");
    return { session: mapSession(session), wallet: await walletSnapshot(user.id) };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function leaveRoom(user, roomId) {
  const active = await query(
    `select id
       from voice_video_room_sessions
      where room_id = $1
        and user_id = $2
        and status = 'active'
      limit 1`,
    [roomId, user.id]
  );
  if (!active.rows[0]) throw badRequest("No active session found for this room.", 404);
  return endSession(user, active.rows[0].id, "completed");
}

async function walletSnapshot(userId) {
  const result = await query(
    `select balance,
            lifetime_earned as "lifetimeEarned",
            lifetime_spent as "lifetimeSpent"
       from wallets
      where user_id = $1`,
    [userId]
  );
  return result.rows[0] || { balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 };
}

module.exports = {
  COINS_PER_MINUTE,
  SESSION_LIMIT_SECONDS,
  createRoom,
  endSession,
  getRoom,
  joinRoom,
  leaveRoom,
  listRooms
};
