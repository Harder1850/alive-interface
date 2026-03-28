"use strict";
(() => {
  // ../packages/runtime-client/src/index.ts
  var Emitter = class {
    constructor() {
      this.handlers = /* @__PURE__ */ new Map();
    }
    on(event, handler) {
      let list = this.handlers.get(event);
      if (!list) {
        list = [];
        this.handlers.set(event, list);
      }
      list.push(handler);
      return () => this.off(event, handler);
    }
    off(event, handler) {
      const list = this.handlers.get(event);
      if (list) this.handlers.set(event, list.filter((h) => h !== handler));
    }
    emit(event, data) {
      const list = this.handlers.get(event);
      if (list) list.forEach((h) => {
        try {
          h(data);
        } catch (e) {
          console.error("[Emitter]", e);
        }
      });
    }
  };
  var RuntimeClient = class {
    constructor() {
      this.emitter = new Emitter();
      this.ws = null;
      this.wsUrl = "";
      this.reconnect = null;
      // Mirror of runtime state (updated from incoming events)
      this._status = {
        running: false,
        mode: "idle",
        signal_count: 0,
        error_count: 0,
        uptime_ms: 0
      };
      this._traces = /* @__PURE__ */ new Map();
      this._connected = false;
    }
    // ─── Connection ──────────────────────────────────────────────────────────
    /** Call once from app.ts after DOM is ready. */
    connect(url) {
      this.wsUrl = url ?? `ws://${window.location.host}`;
      this._open();
    }
    _open() {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        return;
      }
      console.log(`[RuntimeClient] Connecting \u2192 ${this.wsUrl}`);
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => {
        this._connected = true;
        if (this.reconnect) {
          clearTimeout(this.reconnect);
          this.reconnect = null;
        }
        console.log("[RuntimeClient] Connected");
        this.emitter.emit("client.connected", {});
      };
      this.ws.onmessage = (msg) => {
        try {
          const event = JSON.parse(msg.data);
          this._handle(event);
        } catch (e) {
          console.error("[RuntimeClient] Bad message:", e);
        }
      };
      this.ws.onclose = () => {
        this._connected = false;
        this.emitter.emit("client.disconnected", {});
        console.warn("[RuntimeClient] Disconnected \u2014 retrying in 3 s");
        this.reconnect = setTimeout(() => this._open(), 3e3);
      };
      this.ws.onerror = () => {
      };
    }
    // ─── Commands ─────────────────────────────────────────────────────────────
    async executeCommand(cmd) {
      if (cmd.type === "clear_trace") {
        this._traces.clear();
        this.emitter.emit("trace.cleared", {});
        return;
      }
      if (!this._connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        const msg = "Not connected to ALIVE Studio server";
        console.warn("[RuntimeClient]", msg);
        this.emitter.emit("runtime.error", { error: msg, stage: cmd.type });
        return;
      }
      this.ws.send(JSON.stringify(cmd));
    }
    // ─── Event handling ───────────────────────────────────────────────────────
    _handle(event) {
      if (event.type === "status.update") {
        this._status = { ...event.status };
        this.emitter.emit("status.updated", this._status);
        return;
      }
      switch (event.type) {
        case "runtime.started":
          this._status.running = true;
          this._status.profile = event.profile;
          this._status.mode = "active";
          break;
        case "runtime.stopped":
          this._status.running = false;
          this._status.mode = "idle";
          break;
        case "signal.received":
          this._status.signal_count++;
          this._status.last_signal = event.signal_id;
          this._traces.set(event.signal_id, {
            signal_id: event.signal_id,
            raw_content: event.raw_content,
            timestamp: event.timestamp,
            events: []
          });
          break;
        case "stg.evaluated":
          this._status.last_stg_verdict = event.verdict;
          break;
        case "pipeline.error":
          this._status.error_count++;
          break;
      }
      if ("signal_id" in event && event.signal_id) {
        const trace = this._traces.get(event.signal_id);
        if (trace) {
          trace.events.push(event);
          const terminal = event.type === "execution.completed" || event.type === "ltg.evaluated" || event.type === "pipeline.error" || event.type === "pipeline.terminated";
          if (terminal) {
            trace.final_result = event.type;
            if (event.type === "pipeline.terminated" || event.type === "pipeline.error") {
              trace.terminal_stage = "stage" in event ? event.stage : "unknown";
            }
            this.emitter.emit("trace.updated", { ...trace, events: [...trace.events] });
          }
        }
      }
      this.emitter.emit(event.type, event);
      this.emitter.emit("pipeline.event", event);
    }
    // ─── Subscriptions ────────────────────────────────────────────────────────
    on(event, handler) {
      return this.emitter.on(event, handler);
    }
    // ─── Queries ──────────────────────────────────────────────────────────────
    getStatus() {
      return { ...this._status };
    }
    isConnected() {
      return this._connected;
    }
    getTrace(id) {
      return this._traces.get(id);
    }
    getAllTraces() {
      return Array.from(this._traces.values());
    }
  };
  var runtimeClient = new RuntimeClient();

  // ../plugins/alive-launcher/src/index.ts
  var LauncherPlugin = class {
    constructor() {
      this.root = null;
    }
    /** Called by app.ts — renders into the supplied container. */
    mount(root) {
      this.root = root;
      this.render();
      this.bind();
    }
    // ─── Render ──────────────────────────────────────────────────────────────
    render() {
      if (!this.root) return;
      this.root.innerHTML = `
      <div class="lp-wrap">

        <div class="lp-header">
          <span class="lp-title">ALIVE Launcher</span>
          <span class="lp-badge stopped" data-id="badge">\u25CF STOPPED</span>
        </div>

        <div class="lp-row">
          <label class="lp-label">Profile</label>
          <select class="lp-select" data-id="profile">
            <option value="default">default</option>
            <option value="debug">debug</option>
            <option value="conservative">conservative</option>
            <option value="aggressive">aggressive</option>
          </select>
        </div>

        <div class="lp-buttons">
          <button class="lp-btn lp-btn-start" data-id="start">\u25B6 Start ALIVE</button>
          <button class="lp-btn lp-btn-stop"  data-id="stop"  disabled>\u23F9 Stop</button>
        </div>

        <div class="lp-stat-grid">
          <div class="lp-stat">
            <div class="lp-stat-label">Status</div>
            <div class="lp-stat-val" data-id="s-status">Stopped</div>
          </div>
          <div class="lp-stat">
            <div class="lp-stat-label">Uptime</div>
            <div class="lp-stat-val" data-id="s-uptime">\u2014</div>
          </div>
          <div class="lp-stat">
            <div class="lp-stat-label">Signals</div>
            <div class="lp-stat-val" data-id="s-signals">0</div>
          </div>
          <div class="lp-stat">
            <div class="lp-stat-label">Mode</div>
            <div class="lp-stat-val" data-id="s-mode">\u2014</div>
          </div>
          <div class="lp-stat">
            <div class="lp-stat-label">Last STG</div>
            <div class="lp-stat-val" data-id="s-stg">\u2014</div>
          </div>
          <div class="lp-stat">
            <div class="lp-stat-label">Errors</div>
            <div class="lp-stat-val" data-id="s-errors">0</div>
          </div>
        </div>

        <div class="lp-conn" data-id="conn">\u25CC Connecting to studio server\u2026</div>

      </div>
    `;
    }
    // ─── Bind ─────────────────────────────────────────────────────────────────
    bind() {
      const q = (id) => this.root.querySelector(`[data-id="${id}"]`);
      const startBtn = q("start");
      const stopBtn = q("stop");
      const profile = q("profile");
      startBtn.addEventListener("click", () => runtimeClient.executeCommand({ type: "start", profile: profile.value }));
      stopBtn.addEventListener("click", () => runtimeClient.executeCommand({ type: "stop" }));
      runtimeClient.on("client.connected", () => {
        const el = q("conn");
        if (el) {
          el.textContent = "\u25C9 Connected to studio server";
          el.className = "lp-conn connected";
        }
      });
      runtimeClient.on("client.disconnected", () => {
        const el = q("conn");
        if (el) {
          el.textContent = "\u25CC Reconnecting\u2026";
          el.className = "lp-conn";
        }
      });
      const setRunning = (running) => {
        startBtn.disabled = running;
        stopBtn.disabled = !running;
        const badge = q("badge");
        if (badge) {
          badge.textContent = running ? "\u25CF RUNNING" : "\u25CF STOPPED";
          badge.className = `lp-badge ${running ? "running" : "stopped"}`;
        }
      };
      runtimeClient.on("runtime.started", () => {
        setRunning(true);
        this.refresh();
      });
      runtimeClient.on("runtime.stopped", () => {
        setRunning(false);
        this.refresh();
      });
      runtimeClient.on("status.updated", (s) => this.displayStatus(s));
      runtimeClient.on("pipeline.event", () => this.refresh());
      runtimeClient.on("stg.evaluated", (e) => {
        const ev = e;
        const el = q("s-stg");
        if (el) {
          el.textContent = ev.verdict;
          el.className = `lp-stat-val stg-${ev.verdict.toLowerCase()}`;
        }
      });
    }
    refresh() {
      this.displayStatus(runtimeClient.getStatus());
    }
    displayStatus(s) {
      const q = (id) => this.root?.querySelector(`[data-id="${id}"]`);
      const set = (id, v) => {
        const el = q(id);
        if (el) el.textContent = v;
      };
      set("s-status", s.running ? "Running" : "Stopped");
      set("s-uptime", s.running ? `${(s.uptime_ms / 1e3).toFixed(1)} s` : "\u2014");
      set("s-signals", String(s.signal_count));
      set("s-mode", s.mode ?? "\u2014");
      set("s-errors", String(s.error_count));
      const badge = q("badge");
      if (badge) {
        badge.textContent = s.running ? "\u25CF RUNNING" : "\u25CF STOPPED";
        badge.className = `lp-badge ${s.running ? "running" : "stopped"}`;
      }
    }
  };

  // ../plugins/alive-trace/src/index.ts
  var STAGE_LABELS = {
    "signal.received": "\u2460 Ingested",
    "signal.filtered": "\u2461 Filtered",
    "firewall.checked": "\u2462 Firewall",
    "cb.evaluated": "\u2463 CB",
    "stg.evaluated": "\u2464 STG",
    "mind.started": "\u2465 Mind start",
    "mind.completed": "\u2466 Mind done",
    "executive.evaluated": "\u2467 Executive",
    "execution.completed": "\u2468 Executed",
    "ltg.evaluated": "\u2469 LTG",
    "pipeline.terminated": "\u2715 Terminated",
    "pipeline.error": "\u2715 Error"
  };
  var TracePlugin = class {
    constructor() {
      this.root = null;
      this.traces = /* @__PURE__ */ new Map();
    }
    mount(root) {
      this.root = root;
      this.render();
      this.bind();
    }
    // ─── Render ──────────────────────────────────────────────────────────────
    render() {
      if (!this.root) return;
      this.root.innerHTML = `
      <div class="tp-wrap">
        <div class="tp-toolbar">
          <span class="tp-title">Signal Trace</span>
          <button class="tp-clear-btn" data-id="clear">Clear</button>
        </div>
        <div class="tp-list" data-id="list">
          <div class="tp-empty">Waiting for signals\u2026</div>
        </div>
      </div>
    `;
    }
    // ─── Bind ─────────────────────────────────────────────────────────────────
    bind() {
      const clearBtn = this.root?.querySelector('[data-id="clear"]');
      clearBtn?.addEventListener("click", () => runtimeClient.executeCommand({ type: "clear_trace" }));
      runtimeClient.on("trace.updated", (t) => {
        const te = t;
        this.traces.set(te.signal_id, te);
        this.renderList();
      });
      runtimeClient.on("trace.cleared", () => {
        this.traces.clear();
        this.renderList();
      });
      runtimeClient.on("pipeline.event", (ev) => {
        const e = ev;
        if (!("signal_id" in e) || !e.signal_id) return;
        let trace = this.traces.get(e.signal_id);
        if (!trace && e.type === "signal.received") {
          trace = {
            signal_id: e.signal_id,
            raw_content: e.raw_content,
            timestamp: e.timestamp,
            events: []
          };
          this.traces.set(e.signal_id, trace);
        }
        if (trace && !trace.events.find((x) => JSON.stringify(x) === JSON.stringify(e))) {
          trace.events.push(e);
        }
        this.renderList();
      });
    }
    // ─── Rendering ────────────────────────────────────────────────────────────
    renderList() {
      const list = this.root?.querySelector('[data-id="list"]');
      if (!list) return;
      if (this.traces.size === 0) {
        list.innerHTML = '<div class="tp-empty">Waiting for signals\u2026</div>';
        return;
      }
      const sorted = Array.from(this.traces.values()).sort((a, b) => b.timestamp - a.timestamp);
      list.innerHTML = sorted.map((t) => this.renderCard(t)).join("");
      list.querySelectorAll(".tp-card-head").forEach((head) => {
        head.addEventListener("click", () => {
          const body = head.nextElementSibling;
          if (body) body.classList.toggle("open");
          head.querySelector(".tp-chevron").textContent = body?.classList.contains("open") ? "\u25BE" : "\u25B8";
        });
      });
    }
    renderCard(t) {
      const isError = t.final_result === "pipeline.error";
      const isTerminated = t.final_result === "pipeline.terminated";
      const isDone = !!t.final_result;
      const statusCls = isError || isTerminated ? "card-error" : isDone ? "card-done" : "card-live";
      const label = t.raw_content.length > 32 ? t.raw_content.slice(0, 32) + "\u2026" : t.raw_content;
      const time = new Date(t.timestamp).toLocaleTimeString();
      return `
      <div class="tp-card ${statusCls}">
        <div class="tp-card-head">
          <span class="tp-chevron">\u25B8</span>
          <span class="tp-card-label">"${this.esc(label)}"</span>
          <span class="tp-card-meta">${t.events.length} stages \xB7 ${time}</span>
        </div>
        <div class="tp-card-body">
          ${t.events.map((e) => this.renderStage(e)).join("")}
          ${!isDone ? '<div class="tp-stage tp-stage-live">\u27F3 Processing\u2026</div>' : ""}
        </div>
      </div>
    `;
    }
    renderStage(e) {
      const label = STAGE_LABELS[e.type] ?? e.type;
      const detail = this.stageDetail(e);
      const cls = e.type === "pipeline.error" || e.type === "pipeline.terminated" ? "tp-stage tp-stage-fail" : e.type === "execution.completed" || e.type === "ltg.evaluated" ? "tp-stage tp-stage-ok" : "tp-stage";
      return `<div class="${cls}"><span class="tp-stage-name">${label}</span><span class="tp-stage-detail">${this.esc(detail)}</span></div>`;
    }
    stageDetail(e) {
      switch (e.type) {
        case "signal.filtered":
          return e.passed ? "passed" : "dropped";
        case "firewall.checked":
          return e.status + (e.reason ? ` \u2014 ${e.reason}` : "");
        case "cb.evaluated":
          return `novelty=${e.novelty.toFixed(2)} recurrence=${e.recurrence.toFixed(2)}`;
        case "stg.evaluated":
          return e.verdict;
        case "mind.completed":
          return `${e.action_type} (conf ${(e.confidence * 100).toFixed(0)}%)`;
        case "executive.evaluated":
          return e.verdict + (e.reason ? ` \u2014 ${e.reason}` : "");
        case "execution.completed":
          return `${e.action_type} \u2192 "${e.result}"`;
        case "ltg.evaluated":
          return e.result;
        case "pipeline.terminated":
          return `${e.stage}: ${e.reason}`;
        case "pipeline.error":
          return `${e.stage}: ${e.error}`;
        default:
          return "";
      }
    }
    esc(s) {
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
  };

  // ../plugins/alive-signals/src/index.ts
  var SCENARIOS = [
    { icon: "\u{1F9EA}", label: "Hello", payload: "hello" },
    { icon: "\u{1F4CA}", label: "Status check", payload: "status check" },
    { icon: "\u{1F525}", label: "CPU spike", payload: "cpu spike detected" },
    { icon: "\u{1F4BE}", label: "Disk low", payload: "disk space low warning" },
    { icon: "\u{1F501}", label: "Repeated signal", payload: "repeated ping ping ping" },
    { icon: "\u26A0\uFE0F", label: "System alert", payload: "system alert critical" },
    { icon: "\u{1F6AB}", label: "Force DENY", payload: "deny this signal now" },
    { icon: "\u23F1\uFE0F", label: "Force DEFER", payload: "defer this until later" }
  ];
  var SignalsPlugin = class {
    constructor() {
      this.root = null;
    }
    mount(root) {
      this.root = root;
      this.render();
      this.bind();
    }
    // ─── Render ──────────────────────────────────────────────────────────────
    render() {
      if (!this.root) return;
      this.root.innerHTML = `
      <div class="sp-wrap">
        <div class="sp-section">
          <div class="sp-section-title">Predefined Scenarios</div>
          <div class="sp-grid">
            ${SCENARIOS.map((s) => `
              <button class="sp-scenario-btn" data-payload="${this.esc(s.payload)}">
                <span class="sp-icon">${s.icon}</span>
                <span class="sp-label">${this.esc(s.label)}</span>
              </button>
            `).join("")}
          </div>
        </div>

        <div class="sp-section">
          <div class="sp-section-title">Custom Signal</div>
          <div class="sp-custom-row">
            <input
              class="sp-input"
              data-id="custom-input"
              type="text"
              placeholder="Type signal payload and press Enter or \u25B6"
              autocomplete="off"
            />
            <button class="sp-inject-btn" data-id="inject-btn">\u25B6 Inject</button>
          </div>
        </div>

        <div class="sp-feedback" data-id="feedback" hidden></div>
      </div>
    `;
    }
    // ─── Bind ─────────────────────────────────────────────────────────────────
    bind() {
      if (!this.root) return;
      this.root.querySelectorAll(".sp-scenario-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const payload = btn.dataset.payload ?? "";
          this.inject(payload);
        });
      });
      const input = this.root.querySelector('[data-id="custom-input"]');
      const injectBtn = this.root.querySelector('[data-id="inject-btn"]');
      injectBtn.addEventListener("click", () => {
        const v = input.value.trim();
        if (v) {
          this.inject(v);
          input.value = "";
        }
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const v = input.value.trim();
          if (v) {
            this.inject(v);
            input.value = "";
          }
        }
      });
      runtimeClient.on("signal.received", (ev) => {
        const e = ev;
        this.feedback(`Injected: "${e.raw_content}"`, "ok");
      });
      runtimeClient.on("runtime.error", (ev) => {
        const e = ev;
        this.feedback(e.error, "err");
      });
    }
    async inject(payload) {
      const status = runtimeClient.getStatus();
      if (!status.running) {
        this.feedback("Runtime not running \u2014 click \u25B6 Start ALIVE first", "warn");
        return;
      }
      await runtimeClient.executeCommand({ type: "inject_signal", payload });
    }
    feedback(msg, type) {
      const el = this.root?.querySelector('[data-id="feedback"]');
      if (!el) return;
      el.textContent = msg;
      el.className = `sp-feedback sp-fb-${type}`;
      el.hidden = false;
      setTimeout(() => {
        if (el) el.hidden = true;
      }, 4e3);
    }
    esc(s) {
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
  };

  // ../plugins/alive-state/src/index.ts
  var StatePlugin = class {
    constructor() {
      this.root = null;
      // ─── Bind ─────────────────────────────────────────────────────────────────
      this.recentEvents = [];
    }
    mount(root) {
      this.root = root;
      this.render();
      this.bind();
    }
    // ─── Render ──────────────────────────────────────────────────────────────
    render() {
      if (!this.root) return;
      this.root.innerHTML = `
      <div class="stp-wrap">

        <div class="stp-section-title">Session</div>
        <div class="stp-grid">
          <div class="stp-card">
            <div class="stp-card-label">Runtime</div>
            <div class="stp-card-val stopped" data-id="runtime-status">\u25CF Stopped</div>
          </div>
          <div class="stp-card">
            <div class="stp-card-label">Profile</div>
            <div class="stp-card-val" data-id="profile">\u2014</div>
          </div>
          <div class="stp-card">
            <div class="stp-card-label">Mode</div>
            <div class="stp-card-val" data-id="mode">idle</div>
          </div>
          <div class="stp-card">
            <div class="stp-card-label">Uptime</div>
            <div class="stp-card-val" data-id="uptime">\u2014</div>
          </div>
        </div>

        <div class="stp-section-title" style="margin-top:18px">Pipeline</div>
        <div class="stp-grid">
          <div class="stp-card">
            <div class="stp-card-label">Signals</div>
            <div class="stp-card-val" data-id="signals">0</div>
          </div>
          <div class="stp-card">
            <div class="stp-card-label">Last STG</div>
            <div class="stp-card-val" data-id="last-stg">\u2014</div>
          </div>
          <div class="stp-card">
            <div class="stp-card-label">Errors</div>
            <div class="stp-card-val" data-id="errors">0</div>
          </div>
          <div class="stp-card">
            <div class="stp-card-label">Last Signal</div>
            <div class="stp-card-val" data-id="last-signal">\u2014</div>
          </div>
        </div>

        <div class="stp-section-title" style="margin-top:18px">Recent Pipeline Events</div>
        <div class="stp-event-feed" data-id="feed">
          <div class="stp-feed-empty">No events yet</div>
        </div>

      </div>
    `;
    }
    bind() {
      runtimeClient.on("runtime.started", () => this.refresh());
      runtimeClient.on("runtime.stopped", () => this.refresh());
      runtimeClient.on("status.updated", (s) => this.displayStatus(s));
      runtimeClient.on("pipeline.event", (ev) => {
        this.refresh();
        this.addFeedEvent(ev);
      });
      this.refresh();
    }
    refresh() {
      this.displayStatus(runtimeClient.getStatus());
    }
    displayStatus(s) {
      const set = (id, v, cls) => {
        const el = this.root?.querySelector(`[data-id="${id}"]`);
        if (!el) return;
        el.textContent = v;
        if (cls !== void 0) el.className = `stp-card-val ${cls}`;
      };
      set(
        "runtime-status",
        s.running ? "\u25CF Running" : "\u25CF Stopped",
        s.running ? "running" : "stopped"
      );
      set("profile", s.profile ?? "\u2014");
      set("mode", s.mode ?? "idle");
      set("uptime", s.running ? `${(s.uptime_ms / 1e3).toFixed(1)} s` : "\u2014");
      set("signals", String(s.signal_count));
      set(
        "last-stg",
        s.last_stg_verdict ?? "\u2014",
        s.last_stg_verdict ? `stg-${s.last_stg_verdict.toLowerCase()}` : ""
      );
      set("errors", String(s.error_count));
      set("last-signal", s.last_signal ? s.last_signal.slice(0, 16) + "\u2026" : "\u2014");
    }
    addFeedEvent(e) {
      const label = this.eventLabel(e);
      if (!label) return;
      this.recentEvents.unshift({ type: e.type, label, ts: Date.now() });
      if (this.recentEvents.length > 20) this.recentEvents.pop();
      const feed = this.root?.querySelector('[data-id="feed"]');
      if (!feed) return;
      feed.innerHTML = this.recentEvents.map((ev) => {
        const cls = ev.type.includes("error") || ev.type.includes("terminated") ? "stp-feed-entry err" : ev.type === "execution.completed" || ev.type === "ltg.evaluated" ? "stp-feed-entry ok" : "stp-feed-entry";
        const time = new Date(ev.ts).toLocaleTimeString("en", { hour12: false });
        return `<div class="${cls}"><span class="stp-feed-time">${time}</span><span class="stp-feed-label">${this.esc(ev.label)}</span></div>`;
      }).join("");
    }
    eventLabel(e) {
      switch (e.type) {
        case "signal.received":
          return `Signal in: "${"raw_content" in e ? e.raw_content : ""}"`;
        case "stg.evaluated":
          return `STG \u2192 ${"verdict" in e ? e.verdict : ""}`;
        case "mind.completed":
          return `Mind \u2192 ${"action_type" in e ? e.action_type : ""}`;
        case "execution.completed":
          return `Executed \u2192 "${"result" in e ? e.result : ""}"`;
        case "pipeline.terminated":
          return `\u2715 Terminated @ ${"stage" in e ? e.stage : ""}`;
        case "pipeline.error":
          return `\u2715 Error @ ${"stage" in e ? e.stage : ""}`;
        case "runtime.started":
          return `Runtime started`;
        case "runtime.stopped":
          return `Runtime stopped`;
        default:
          return "";
      }
    }
    esc(s) {
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  };

  // ../plugins/alive-logs/src/index.ts
  var LogsPlugin = class {
    constructor() {
      this.root = null;
      this.logs = [];
      this.maxLogs = 500;
      this.filter = "";
    }
    mount(root) {
      this.root = root;
      this.render();
      this.bind();
      this.interceptConsole();
    }
    // ─── Render ──────────────────────────────────────────────────────────────
    render() {
      if (!this.root) return;
      this.root.innerHTML = `
      <div class="logp-wrap">
        <div class="logp-toolbar">
          <span class="logp-title">Logs</span>
          <div class="logp-controls">
            <select class="logp-filter" data-id="filter">
              <option value="">All</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
            <button class="logp-clear-btn" data-id="clear">Clear</button>
          </div>
        </div>
        <div class="logp-list" data-id="list">
          <div class="logp-empty">Waiting for logs\u2026</div>
        </div>
      </div>
    `;
    }
    // ─── Bind ─────────────────────────────────────────────────────────────────
    bind() {
      const filterSel = this.root?.querySelector('[data-id="filter"]');
      const clearBtn = this.root?.querySelector('[data-id="clear"]');
      filterSel?.addEventListener("change", () => {
        this.filter = filterSel.value;
        this.renderList();
      });
      clearBtn?.addEventListener("click", () => {
        this.logs = [];
        this.renderList();
      });
      runtimeClient.on("pipeline.event", (ev) => {
        const e = ev;
        const msg = this.eventToMessage(e);
        if (msg) {
          const level = e.type.includes("error") || e.type.includes("terminated") ? "error" : "info";
          this.push(level, "pipeline", msg);
        }
      });
      runtimeClient.on("runtime.error", (ev) => {
        const e = ev;
        this.push("error", "runtime", `[${e.stage}] ${e.error}`);
      });
      runtimeClient.on("runtime.started", (ev) => {
        const e = ev;
        this.push("info", "runtime", `Started (profile: ${e.profile})`);
      });
      runtimeClient.on("runtime.stopped", () => this.push("info", "runtime", "Stopped"));
      runtimeClient.on("client.connected", () => this.push("info", "studio", "Connected to studio server"));
      runtimeClient.on("client.disconnected", () => this.push("warn", "studio", "Disconnected \u2014 reconnecting"));
    }
    interceptConsole() {
      const orig = { log: console.log, warn: console.warn, error: console.error };
      console.log = (...args) => {
        orig.log.apply(console, args);
        const msg = args.map((a) => typeof a === "string" ? a : JSON.stringify(a)).join(" ");
        if (msg.includes("[RuntimeClient]") || msg.includes("[Studio]") || msg.includes("[Mock]")) {
          this.push("info", "console", msg);
        }
      };
      console.warn = (...args) => {
        orig.warn.apply(console, args);
        this.push("warn", "console", args.map((a) => String(a)).join(" "));
      };
      console.error = (...args) => {
        orig.error.apply(console, args);
        this.push("error", "console", args.map((a) => String(a)).join(" "));
      };
    }
    // ─── Log management ───────────────────────────────────────────────────────
    push(level, source, message) {
      this.logs.push({ ts: Date.now(), level, source, message });
      if (this.logs.length > this.maxLogs) this.logs.shift();
      this.renderList();
    }
    renderList() {
      const list = this.root?.querySelector('[data-id="list"]');
      if (!list) return;
      const visible = this.filter ? this.logs.filter((l) => l.level === this.filter) : this.logs;
      if (visible.length === 0) {
        list.innerHTML = '<div class="logp-empty">No logs</div>';
        return;
      }
      list.innerHTML = visible.map((l) => this.renderEntry(l)).join("");
      list.scrollTop = list.scrollHeight;
    }
    renderEntry(l) {
      const time = new Date(l.ts).toLocaleTimeString("en", { hour12: false });
      const icon = l.level === "error" ? "\u2715" : l.level === "warn" ? "\u26A0" : "\xB7";
      return `<div class="logp-entry ${l.level}">
      <span class="logp-time">${time}</span>
      <span class="logp-icon">${icon}</span>
      <span class="logp-src">[${l.source}]</span>
      <span class="logp-msg">${this.esc(l.message)}</span>
    </div>`;
    }
    eventToMessage(e) {
      switch (e.type) {
        case "signal.received":
          return `Signal received: "${"raw_content" in e ? e.raw_content : ""}"`;
        case "signal.filtered":
          return `Filter: ${"passed" in e && e.passed ? "passed" : "dropped"}`;
        case "firewall.checked":
          return `Firewall: ${"status" in e ? e.status : ""}`;
        case "stg.evaluated":
          return `STG verdict: ${"verdict" in e ? e.verdict : ""}`;
        case "mind.completed":
          return `Mind: ${"action_type" in e ? e.action_type : ""} (conf ${"confidence" in e ? (e.confidence * 100).toFixed(0) : "?"}%)`;
        case "executive.evaluated":
          return `Executive: ${"verdict" in e ? e.verdict : ""}`;
        case "execution.completed":
          return `Executed: ${"action_type" in e ? e.action_type : ""} \u2192 "${"result" in e ? e.result : ""}"`;
        case "ltg.evaluated":
          return `LTG: ${"result" in e ? e.result : ""}`;
        case "pipeline.terminated":
          return `Pipeline terminated @ ${"stage" in e ? e.stage : ""}: ${"reason" in e ? e.reason : ""}`;
        case "pipeline.error":
          return `Pipeline error @ ${"stage" in e ? e.stage : ""}: ${"error" in e ? e.error : ""}`;
        default:
          return "";
      }
    }
    esc(s) {
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
  };

  // src/client/app.ts
  document.addEventListener("DOMContentLoaded", () => {
    runtimeClient.connect();
    mount("panel-launcher", new LauncherPlugin());
    mount("panel-trace", new TracePlugin());
    mount("panel-signals", new SignalsPlugin());
    mount("panel-state", new StatePlugin());
    mount("panel-logs", new LogsPlugin());
    setupTabs();
    setupCommandPalette();
    setupSidebarNav();
    setupVSCode();
    setupStatusBar();
    window.addEventListener("studio:inject", (e) => {
      const payload = e.detail?.payload;
      if (payload) runtimeClient.executeCommand({ type: "inject_signal", payload });
    });
    console.log("[Studio] ALIVE Studio initialised");
  });
  function mount(id, plugin) {
    const el = document.getElementById(id);
    if (!el) {
      console.error(`[Studio] Panel not found: #${id}`);
      return;
    }
    plugin.mount(el);
  }
  function setupTabs() {
    const tabs = document.querySelectorAll(".tab");
    const panels = document.querySelectorAll(".panel");
    function activate(tabId) {
      tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === tabId));
      panels.forEach((p) => {
        const active = p.id === `panel-${tabId}`;
        p.style.display = active ? "block" : "none";
      });
    }
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const id = tab.dataset.tab;
        if (id) activate(id);
      });
    });
    activate("launcher");
  }
  function setupSidebarNav() {
    document.querySelectorAll("[data-nav]").forEach((el) => {
      el.addEventListener("click", () => {
        const target = el.dataset.nav;
        if (!target) return;
        document.querySelector(`.tab[data-tab="${target}"]`)?.click();
      });
    });
  }
  function buildCommands() {
    return [
      {
        label: "ALIVE: Start",
        action: () => runtimeClient.executeCommand({ type: "start", profile: "default" })
      },
      {
        label: "ALIVE: Stop",
        action: () => runtimeClient.executeCommand({ type: "stop" })
      },
      {
        label: "ALIVE: Request Status",
        action: () => runtimeClient.executeCommand({ type: "request_status" })
      },
      {
        label: "ALIVE: Inject CPU Spike",
        action: () => runtimeClient.executeCommand({ type: "inject_signal", payload: "cpu spike detected" })
      },
      {
        label: "ALIVE: Inject Disk Low",
        action: () => runtimeClient.executeCommand({ type: "inject_signal", payload: "disk space low warning" })
      },
      {
        label: "ALIVE: Inject Repeated Signal",
        action: () => runtimeClient.executeCommand({ type: "inject_signal", payload: "repeated ping ping ping" })
      },
      {
        label: "ALIVE: Inject Hello",
        action: () => runtimeClient.executeCommand({ type: "inject_signal", payload: "hello" })
      },
      {
        label: "ALIVE: Force STG DENY",
        action: () => runtimeClient.executeCommand({ type: "inject_signal", payload: "deny this signal now" })
      },
      {
        label: "ALIVE: Force STG DEFER",
        action: () => runtimeClient.executeCommand({ type: "inject_signal", payload: "defer this until later" })
      },
      {
        label: "ALIVE: Clear Trace",
        action: () => runtimeClient.executeCommand({ type: "clear_trace" })
      },
      {
        label: "ALIVE: Open Launcher",
        action: () => document.querySelector('.tab[data-tab="launcher"]')?.click()
      },
      {
        label: "ALIVE: Open Trace",
        action: () => document.querySelector('.tab[data-tab="trace"]')?.click()
      },
      {
        label: "ALIVE: Open Signals",
        action: () => document.querySelector('.tab[data-tab="signals"]')?.click()
      },
      {
        label: "ALIVE: Open State",
        action: () => document.querySelector('.tab[data-tab="state"]')?.click()
      },
      {
        label: "ALIVE: Open Logs",
        action: () => document.querySelector('.tab[data-tab="logs"]')?.click()
      }
    ];
  }
  function setupCommandPalette() {
    const overlay = document.getElementById("cmd-overlay");
    const input = document.getElementById("cmd-input");
    const resultBox = document.getElementById("cmd-results");
    const commands = buildCommands();
    let selected = 0;
    function open() {
      overlay.style.display = "flex";
      input.value = "";
      render(commands);
      input.focus();
      selected = 0;
    }
    function close() {
      overlay.style.display = "none";
    }
    function render(cmds) {
      resultBox.innerHTML = cmds.map(
        (c, i) => `<div class="cmd-item ${i === selected ? "selected" : ""}" data-index="${i}">${esc(c.label)}</div>`
      ).join("");
      resultBox.querySelectorAll(".cmd-item").forEach((item) => {
        item.addEventListener("click", () => {
          const idx = Number(item.dataset.index);
          cmds[idx]?.action();
          close();
        });
      });
    }
    input.addEventListener("input", () => {
      selected = 0;
      const q = input.value.toLowerCase();
      const filtered = q ? commands.filter((c) => c.label.toLowerCase().includes(q)) : commands;
      render(filtered);
    });
    input.addEventListener("keydown", (e) => {
      const items = resultBox.querySelectorAll(".cmd-item");
      if (e.key === "ArrowDown") {
        selected = Math.min(selected + 1, items.length - 1);
      } else if (e.key === "ArrowUp") {
        selected = Math.max(selected - 1, 0);
      } else if (e.key === "Enter") {
        items[selected]?.click();
        return;
      } else if (e.key === "Escape") {
        close();
        return;
      }
      items.forEach((el, i) => el.classList.toggle("selected", i === selected));
      items[selected]?.scrollIntoView({ block: "nearest" });
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        overlay.style.display === "none" ? open() : close();
      }
    });
  }
  function setupVSCode() {
    const btn = document.getElementById("btn-open-vscode");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      try {
        await fetch("/api/open-vscode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: void 0 })
          // server uses ALIVE_REPOS default
        });
      } catch (e) {
        console.error("[Studio] open-vscode failed:", e);
      }
    });
  }
  function setupStatusBar() {
    const bar = document.getElementById("status-bar-text");
    if (!bar) return;
    runtimeClient.on("client.connected", () => setBar("\u25C9 Connected", "connected"));
    runtimeClient.on("client.disconnected", () => setBar("\u25CC Disconnected", "disconnected"));
    runtimeClient.on("runtime.started", (e) => {
      const ev = e;
      setBar(`\u25B6 Running \xB7 ${ev.profile}`, "running");
    });
    runtimeClient.on("runtime.stopped", () => setBar("\u23F9 Stopped", "stopped"));
    function setBar(text, cls) {
      bar.textContent = text;
      bar.className = `sb-text ${cls}`;
    }
  }
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
})();
//# sourceMappingURL=bundle.js.map
