import { escapeHtml, icon, ui } from "../ui.js";

const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

function optionList(items, selected = "") {
  return items.map((item) => `<option value="${escapeHtml(item)}" ${item === selected ? "selected" : ""}>${escapeHtml(item)}</option>`).join("");
}

function languageOptions(appConfig, selected = "") {
  const languages = appConfig.supportedLanguages?.length ? appConfig.supportedLanguages : ["English", "Japanese", "Korean", "Spanish", "French", "German"];
  return optionList(languages, selected);
}

function roomImage(room) {
  if (room.imageUrl) {
    return `<img class="h-16 w-20 rounded-lg object-cover" src="${escapeHtml(room.imageUrl)}" alt="${escapeHtml(room.title)} room picture">`;
  }
  return `
    <div class="grid h-16 w-20 place-items-center rounded-lg bg-brand-mist text-brand-redDark ring-1 ring-brand-line/80">
      ${icon(room.roomType === "video" ? "video" : "mic", "h-6 w-6")}
    </div>
  `;
}

function roomTypeIcon(room) {
  const type = room.roomType === "video" ? "video" : "voice";
  return `
    <span class="grid h-9 w-9 place-items-center rounded-full bg-brand-mist text-brand-redDark ring-1 ring-brand-line/70" aria-label="${escapeHtml(type)} room" title="${escapeHtml(type)} room">
      ${icon(type === "video" ? "video" : "mic", "h-4 w-4")}
    </span>
  `;
}

function disabledButtonClass() {
  return "inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-brand-line bg-brand-line/60 px-4 py-2 text-sm font-semibold text-brand-graphite no-underline opacity-70";
}

function roomAction({ room, activeSession, state }) {
  const balance = Number(state.wallet?.balance || 0);
  const hasCoins = balance >= 1000;
  const active = activeSession?.roomId === room.id;
  const isOwner = room.ownerUserId === state.user.id;
  const full = room.participantCount >= room.maxParticipants;
  if (active) {
    return `<button class="${ui.danger}" data-action="leaveVoiceVideoRoom:${escapeHtml(room.id)}">${icon("logout", "h-4 w-4")}<span>Leave</span></button>`;
  }
  if (!hasCoins) {
    return `<button class="${disabledButtonClass()}" disabled>${icon("coins", "h-4 w-4")}<span>Need coins</span></button>`;
  }
  if (isOwner) {
    return `
      <div class="flex flex-wrap justify-end gap-2">
        <button class="${ui.primary}" data-action="joinVoiceVideoRoom:${escapeHtml(room.id)}">${icon("play", "h-4 w-4")}<span>Start</span></button>
        <button class="${ui.danger}" data-action="deleteVoiceVideoRoom:${escapeHtml(room.id)}">${icon("trash", "h-4 w-4")}<span>Delete</span></button>
      </div>
    `;
  }
  if (!room.hostActive) {
    return `<button class="${disabledButtonClass()}" disabled>${icon("play", "h-4 w-4")}<span>Waiting</span></button>`;
  }
  if (full) {
    return `<button class="${disabledButtonClass()}" disabled>${icon("users", "h-4 w-4")}<span>Full</span></button>`;
  }
  return `<button class="${ui.primary}" data-action="joinVoiceVideoRoom:${escapeHtml(room.id)}">${icon("login", "h-4 w-4")}<span>Join</span></button>`;
}

function formatRemaining(seconds = 360) {
  const remaining = Math.max(0, Number(seconds || 0));
  return `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
}

function roomRows({ rooms, activeSession, state, showHistory }) {
  if (!rooms.length) {
    return `
      <tr>
        <td colspan="7" class="px-4 py-10 text-center text-sm font-semibold text-brand-graphite">No focused practice rooms match these filters.</td>
      </tr>
    `;
  }
  return rooms.map((room) => {
    const hostStatus = room.hostActive ? "Started" : room.ownerUserId === state.user.id ? "Ready to start" : "Waiting for host";
    const historyMeta = showHistory ? `<p class="mt-1 text-xs text-brand-graphite">Joined: ${escapeHtml(room.joinedSummary || "No participants")}</p>` : "";
    const seatLimit = Math.min(4, Number(room.maxParticipants || 4));
    const seatCount = Math.min(Number(room.participantCount || 0), seatLimit);
    return `
      <tr class="border-b border-brand-line/70 align-middle last:border-0">
        <td class="px-4 py-3">${roomImage(room)}</td>
        <td class="min-w-[220px] px-4 py-3">
          <div class="font-bold text-brand-ink">${escapeHtml(room.title)}</div>
          <p class="mt-1 line-clamp-2 text-xs leading-5 text-brand-graphite">${escapeHtml(room.description || "Focused speaking practice for language learners.")}</p>
          ${historyMeta}
        </td>
        <td class="px-4 py-3">${roomTypeIcon(room)}</td>
        <td class="px-4 py-3 text-sm font-semibold text-brand-charcoal">${escapeHtml(room.sourceLanguage)} to ${escapeHtml(room.targetLanguage)}</td>
        <td class="px-4 py-3"><span class="${ui.tag}">${escapeHtml(room.cefrLevel)}</span></td>
        <td class="px-4 py-3 text-sm font-semibold text-brand-charcoal">${seatCount}/${seatLimit}<span class="mt-1 block text-xs text-brand-graphite">${showHistory ? escapeHtml(room.status) : `${hostStatus} ${room.startedAt ? `· ${formatRemaining(room.secondsRemaining)} left` : ""}`}</span></td>
        <td class="px-4 py-3 text-right">
          ${roomAction({ room, activeSession, state })}
        </td>
      </tr>
    `;
  }).join("");
}

function roomCards({ rooms, activeSession, state, showHistory }) {
  if (!rooms.length) {
    return `
      <div class="rounded-lg border border-dashed border-brand-line bg-white/55 p-8 text-center text-sm font-semibold text-brand-graphite">
        No focused practice rooms match these filters.
      </div>
    `;
  }
  return rooms.map((room) => {
    const hostStatus = room.hostActive ? "Started" : room.ownerUserId === state.user.id ? "Ready to start" : "Waiting for host";
    const historyMeta = showHistory ? `<p class="mt-1 text-xs text-brand-graphite">Joined: ${escapeHtml(room.joinedSummary || "No participants")}</p>` : "";
    const seatLimit = Math.min(4, Number(room.maxParticipants || 4));
    const seatCount = Math.min(Number(room.participantCount || 0), seatLimit);
    return `
      <article class="rounded-lg border border-brand-line/80 bg-brand-panel p-4 shadow-[0_1px_2px_rgba(29,41,63,.05)]">
        <div class="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
          ${roomImage(room)}
          <div class="min-w-0">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <h3 class="min-w-0 flex-1 text-base font-bold leading-6 text-brand-ink">${escapeHtml(room.title)}</h3>
              ${roomTypeIcon(room)}
            </div>
            <p class="mt-1 line-clamp-2 text-xs leading-5 text-brand-graphite">${escapeHtml(room.description || "Focused speaking practice for language learners.")}</p>
            ${historyMeta}
          </div>
        </div>
        <div class="mt-4 grid grid-cols-2 gap-2">
          <div class="rounded-lg border border-brand-line/70 bg-white/60 p-3">
            <span class="block text-[11px] font-bold uppercase tracking-[.12em] text-brand-graphite">Language</span>
            <strong class="mt-1 block text-sm text-brand-ink">${escapeHtml(room.sourceLanguage)} to ${escapeHtml(room.targetLanguage)}</strong>
          </div>
          <div class="rounded-lg border border-brand-line/70 bg-white/60 p-3">
            <span class="block text-[11px] font-bold uppercase tracking-[.12em] text-brand-graphite">Level</span>
            <span class="${ui.tag} mt-1">${escapeHtml(room.cefrLevel)}</span>
          </div>
        </div>
        <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-brand-line/70 pt-4">
          <span class="${ui.tagRed}">Seats ${seatCount}/${seatLimit}</span>
          <span class="text-xs font-semibold text-brand-graphite">${showHistory ? escapeHtml(room.status) : `${hostStatus} ${room.startedAt ? `· ${formatRemaining(room.secondsRemaining)} left` : ""}`}</span>
        </div>
        <div class="mt-4 flex justify-end">
          ${roomAction({ room, activeSession, state })}
        </div>
      </article>
    `;
  }).join("");
}

function participantControls({ participant, activeRoom, state }) {
  if (activeRoom.ownerUserId !== state.user.id || participant.userId === state.user.id) return "";
  const payload = `${participant.userId}~`;
  return `
    <div class="mt-2 flex flex-wrap gap-2">
      <button class="${ui.secondary}" data-action="moderateVoiceVideoParticipant:${escapeHtml(activeRoom.id)}:${escapeHtml(`${payload}mute`)}">${icon("mic", "h-4 w-4")}<span>Mute</span></button>
      <button class="${ui.secondary}" data-action="moderateVoiceVideoParticipant:${escapeHtml(activeRoom.id)}:${escapeHtml(`${payload}camera_off`)}">${icon("video", "h-4 w-4")}<span>Camera Off</span></button>
      <button class="${ui.danger}" data-action="moderateVoiceVideoParticipant:${escapeHtml(activeRoom.id)}:${escapeHtml(`${payload}kick`)}">${icon("logout", "h-4 w-4")}<span>Kick</span></button>
    </div>
  `;
}

function participantList({ activeRoom, participants = [], state }) {
  if (!participants.length) return `<p class="mt-4 text-sm font-semibold text-brand-graphite">Participants will appear here after they join.</p>`;
  return `
    <div class="mt-4 grid gap-3">
      ${participants.map((participant) => `
        <div class="rounded-lg border border-brand-line/80 bg-white/60 p-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="text-sm font-bold text-brand-ink">${escapeHtml(participant.displayName)}</p>
              <p class="text-xs font-semibold text-brand-graphite">${escapeHtml(participant.role)}</p>
            </div>
            ${participant.userId === state.user.id ? `<span class="${ui.tagGold}">You</span>` : ""}
          </div>
          ${participantControls({ participant, activeRoom, state })}
        </div>
      `).join("")}
    </div>
  `;
}

function activeRoomPanel({ activeRoom, activeSession, activeParticipants, state }) {
  if (!activeRoom || !activeSession) return "";
  const elapsed = Math.max(0, 360 - Number(activeRoom.secondsRemaining ?? activeSession.secondsRemaining ?? 360));
  const minutes = Math.min(6, Math.max(1, Math.ceil(Math.max(1, elapsed) / 60)));
  return `
    <section class="${ui.card}">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <span class="${ui.tagRed}">Live session</span>
          <h3 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">${escapeHtml(activeRoom.title)}</h3>
          <p class="mt-2 ${ui.muted}">Use the time for sentence practice, pronunciation checks, or a focused language exchange prompt.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button class="${ui.secondary}" data-action="toggleVoiceVideoAudio">${icon("mic", "h-4 w-4")}<span>Mute myself</span></button>
          ${activeRoom.roomType === "video" ? `<button class="${ui.secondary}" data-action="toggleVoiceVideoCamera">${icon("video", "h-4 w-4")}<span>Turn off camera</span></button>` : ""}
          <button class="${ui.danger}" data-action="leaveVoiceVideoRoom:${escapeHtml(activeRoom.id)}">${icon("logout", "h-4 w-4")}<span>Leave Room</span></button>
        </div>
      </div>
      <div class="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div class="min-h-[280px] rounded-lg border border-brand-line bg-brand-ink p-3 text-white">
          <div class="flex min-h-[252px] flex-col gap-3" data-livekit-stage>
            <div class="grid min-h-[252px] place-items-center rounded-lg border border-white/10 bg-white/[.04] text-center">
              <div>
                ${icon(activeRoom.roomType === "video" ? "video" : "mic", "mx-auto h-9 w-9 text-white/72")}
                <p class="mt-3 text-sm font-semibold text-white/78">Connecting to LiveKit Cloud...</p>
              </div>
            </div>
          </div>
        </div>
        <aside class="rounded-lg border border-brand-line/80 bg-white/60 p-4">
          <div class="text-xs font-semibold uppercase tracking-[.16em] text-brand-graphite">Countdown</div>
          <strong class="mt-2 block text-4xl font-bold tabular-nums text-brand-ink" data-room-countdown>06:00</strong>
          <p class="mt-3 text-sm font-semibold text-brand-charcoal">Estimated charge: <span data-room-estimated-charge>${minutes * 1000}</span> coins</p>
          <div class="mt-4 grid gap-2 text-xs font-semibold text-brand-graphite">
            <span>Warnings show at 3 minutes, 1 minute, and 10 seconds remaining.</span>
            <span>At 6 minutes, you are disconnected automatically.</span>
          </div>
          ${participantList({ activeRoom, participants: activeParticipants, state })}
        </aside>
      </div>
    </section>
  `;
}

export function voiceVideoRoomView({ activeVoiceVideoRoom = null, activeVoiceVideoSession = null, activeVoiceVideoParticipants = [], state, appPath }) {
  if (!activeVoiceVideoRoom || !activeVoiceVideoSession) {
    return `
      <div class="grid min-h-[70vh] place-items-center">
        <section class="w-full max-w-xl rounded-lg border border-brand-line/80 bg-brand-panel p-6 text-center shadow-[0_1px_2px_rgba(29,41,63,.05)]">
          <span class="${ui.tagRed}">No active session</span>
          <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">Join a room first</h2>
          <p class="mt-2 ${ui.muted}">Choose an available ${escapeHtml(state.user.targetLanguage)} voice or video room to start a LiveKit session.</p>
          <div class="mt-5 flex justify-center">
            <a class="${ui.primary}" href="${appPath("voiceVideoRooms")}">${icon("video", "h-4 w-4")}<span>Back to rooms</span></a>
          </div>
        </section>
      </div>
    `;
  }
  return `
    <div class="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:px-8">
      ${activeRoomPanel({ activeRoom: activeVoiceVideoRoom, activeSession: activeVoiceVideoSession, activeParticipants: activeVoiceVideoParticipants, state })}
    </div>
  `;
}

export function createVoiceVideoRoomModal({ appConfig, state }) {
  return `
    <div>
      <span class="${ui.tagGold}">Focused practice</span>
      <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">Create Voice/Video Room</h2>
      <p class="mt-2 ${ui.muted}">Create a short practice room with a clear language goal. Rooms are limited to 6 minutes.</p>
      <p class="mt-2 text-xs font-semibold text-brand-graphite">Cost is paid only by participants when they join and leave.</p>
      <form class="mt-5 grid gap-3" data-form="voiceVideoRoom">
        <label class="${ui.label}">Title<input class="${ui.input}" name="title" required maxlength="120" placeholder="Pronunciation practice: travel phrases"></label>
        <label class="${ui.label}">Description<textarea class="${ui.input} min-h-24" name="description" maxlength="1000" placeholder="Practice 5 useful phrases and give quick feedback."></textarea></label>
        <div class="grid gap-3 md:grid-cols-2">
          <label class="${ui.label}">Room type<select class="${ui.input}" name="roomType"><option value="voice">Voice</option><option value="video">Video</option></select></label>
          <label class="${ui.label}">CEFR level<select class="${ui.input}" name="cefrLevel">${optionList(levels, state.user.currentLevel || "A1")}</select></label>
          <label class="${ui.label}">Target language<select class="${ui.input}" name="targetLanguage">${languageOptions(appConfig, state.user.targetLanguage)}</select></label>
          <label class="${ui.label}">Source language<select class="${ui.input}" name="sourceLanguage">${languageOptions(appConfig, "English")}</select></label>
          <label class="${ui.label}">Max participants<input class="${ui.input}" name="maxParticipants" type="number" min="2" max="4" value="4"></label>
          <label class="${ui.label}">Access<select class="${ui.input}" name="isPrivate"><option value="false">Public</option><option value="true">Private</option></select></label>
        </div>
        <label class="${ui.label}">Image<input class="${ui.input}" name="roomImage" type="file" accept="image/jpeg,image/png,image/webp"></label>
        <div class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-brand-line pt-4">
          <p class="text-xs font-semibold text-brand-graphite">JPG, PNG, and WebP images are supported.</p>
          <button class="${ui.primary}">${icon("add", "h-4 w-4")}<span>Create Room</span></button>
        </div>
      </form>
    </div>
  `;
}

export function voiceVideoRoomsView({ state, appConfig, voiceVideoRooms = [], voiceVideoRoomFilters = {}, voiceVideoShowHistory = false, activeVoiceVideoRoom = null, activeVoiceVideoSession = null, activeVoiceVideoParticipants = [] }) {
  const balance = Number(state.wallet?.balance || 0);
  const hasEnoughCoins = balance >= 1000;
  const filtersForm = `
    <form class="grid gap-3 lg:grid-cols-[minmax(180px,1fr)_repeat(2,minmax(140px,180px))_auto]" data-form="voiceVideoRoomFilters">
      <label class="${ui.label}">Search<input class="${ui.input}" name="q" value="${escapeHtml(voiceVideoRoomFilters.q || "")}" placeholder="sentence, pronunciation, exchange"></label>
      <label class="${ui.label}">Level<select class="${ui.input}" name="cefrLevel"><option value="">Any</option>${optionList(levels, voiceVideoRoomFilters.cefrLevel)}</select></label>
      <label class="${ui.label}">Type<select class="${ui.input}" name="roomType"><option value="">Any</option><option value="voice" ${voiceVideoRoomFilters.roomType === "voice" ? "selected" : ""}>Voice</option><option value="video" ${voiceVideoRoomFilters.roomType === "video" ? "selected" : ""}>Video</option></select></label>
      <button class="${ui.secondary} self-end">${icon("filter", "h-4 w-4")}<span>Filter</span></button>
    </form>
  `;
  return `
    <div class="grid gap-5">
      <section class="rounded-lg border border-brand-line/80 bg-brand-panel p-5 shadow-[0_1px_2px_rgba(29,41,63,.05)]">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <span class="${ui.tagGold}">Language exchange</span>
            <h2 class="mt-3 text-3xl font-bold tracking-tight text-brand-ink">Livestream</h2>
            <p class="mt-3 ${ui.muted}">These rooms are for focused language practice, not casual chatting.</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button class="${ui.secondary}" data-action="toggleVoiceVideoHistory">${icon("book", "h-4 w-4")}<span>${voiceVideoShowHistory ? "Hide Past Rooms" : "Past Rooms"}</span></button>
            <button class="${hasEnoughCoins ? ui.primary : disabledButtonClass()}" data-action="openCreateVoiceVideoRoomModal" ${hasEnoughCoins ? "" : "disabled"}>${icon("add", "h-4 w-4")}<span>Create Room</span></button>
          </div>
        </div>
        <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div class="rounded-lg border border-brand-line/70 bg-white/60 p-4"><strong class="block text-brand-ink">6 minutes</strong><span class="text-sm text-brand-graphite">Voice/video rooms are limited to 6 minutes.</span></div>
          <div class="rounded-lg border border-brand-line/70 bg-white/60 p-4"><strong class="block text-brand-ink">1000 coins</strong><span class="text-sm text-brand-graphite">Cost: 1000 coins per minute.</span></div>
          <div class="rounded-lg border border-brand-line/70 bg-white/60 p-4"><strong class="block text-brand-ink">6000 coins</strong><span class="text-sm text-brand-graphite">Maximum cost: 6000 coins.</span></div>
          <div class="rounded-lg border border-brand-line/70 bg-white/60 p-4"><strong class="block text-brand-ink">Earn more</strong><span class="text-sm text-brand-graphite">Read stories, mine sentences, review decks, and engage thoughtfully with the community.</span></div>
        </div>
      </section>

      <section class="${ui.card} lg:block">
        <div class="hidden lg:block">
          ${filtersForm}
        </div>
        <details class="lg:hidden">
          <summary class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg border border-brand-line/90 bg-white/65 px-4 py-2 text-sm font-semibold text-brand-charcoal transition hover:border-brand-orange/50 hover:bg-white">
            <span class="inline-flex items-center gap-2">${icon("search", "h-4 w-4")}Search rooms</span>
            ${icon("filter", "h-4 w-4")}
          </summary>
          <div class="mt-4">
            ${filtersForm}
          </div>
        </details>
        <p class="mt-3 text-xs font-semibold text-brand-graphite">Showing rooms for your selected profile language: ${escapeHtml(state.user.targetLanguage)}.</p>
      </section>

      <section class="grid gap-3 lg:hidden">
        ${roomCards({ rooms: voiceVideoRooms, activeSession: activeVoiceVideoSession, state, showHistory: voiceVideoShowHistory })}
      </section>

      <section class="hidden overflow-hidden rounded-lg border border-brand-line/80 bg-brand-panel shadow-[0_1px_2px_rgba(29,41,63,.05)] lg:block">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[860px] border-collapse text-left">
            <thead class="bg-white/65 text-xs font-semibold uppercase tracking-[.12em] text-brand-graphite">
              <tr>
                <th class="px-4 py-3">Picture</th>
                <th class="px-4 py-3">Room</th>
                <th class="px-4 py-3" aria-label="Room type"></th>
                <th class="px-4 py-3">Languages</th>
                <th class="px-4 py-3">Level</th>
                <th class="px-4 py-3">Seats</th>
                <th class="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>${roomRows({ rooms: voiceVideoRooms, activeSession: activeVoiceVideoSession, state, showHistory: voiceVideoShowHistory })}</tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}
