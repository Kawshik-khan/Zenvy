// Mock of the app's Home tab, revealed under the splash outros.
// Usage: <div class="layer" id="home"></div> then <script src="home.js"></script>.
(() => {
  const style = document.createElement("style");
  style.textContent = `
  /* ---------- Home screen revealed underneath ---------- */
  #home { padding: 56px 22px 0; }
  .row { display: flex; align-items: center; gap: 12px; }
  .card { border: 3px solid var(--ink); border-radius: 18px; box-shadow: 5px 5px 0 var(--ink); background: #fff; }
  .iconbtn { position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border: 3px solid var(--ink); border-radius: 14px; background: #fff; box-shadow: 3px 3px 0 var(--ink); }
  .badge { position: absolute; top: -9px; right: -9px; min-width: 22px; height: 22px; border: 2px solid var(--ink); border-radius: 11px; background: var(--alert, #ff5a36); color: #fff; font: 700 12px/18px "JetBrains Mono", monospace; text-align: center; }
  .pill { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border: 2.5px solid var(--ink); border-radius: 999px; font-weight: 700; font-size: 14px; background: #fff; }
  .avatar { width: 46px; height: 46px; border: 3px solid var(--ink); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; }
  #tabs { position: absolute; left: 0; right: 0; bottom: 0; height: 84px; background: #fff; border-top: 3px solid var(--ink); display: flex; justify-content: space-around; align-items: center; padding-bottom: 14px; }
  #tabs .on { background: var(--focus); border: 3px solid var(--ink); border-radius: 12px; box-shadow: 3px 3px 0 var(--ink); }
  #tabs > div { width: 50px; height: 44px; display: flex; align-items: center; justify-content: center; }
`;
  document.head.appendChild(style);
  document.getElementById("home").innerHTML = `
    <div class="grid" style="opacity:.6"></div>
    <div style="position:relative">
      <div class="row" style="justify-content:space-between">
        <div>
          <div style="font-size:16px;color:var(--muted);font-weight:500">Good morning</div>
          <div style="font-size:34px;font-weight:700;letter-spacing:-.5px">Ready to focus?</div>
        </div>
        <div class="row">
          <div class="iconbtn"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.6" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></div>
          <div class="iconbtn"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg><span class="badge">3</span></div>
        </div>
      </div>

      <div class="card row" style="margin-top:22px;padding:16px;background:var(--match)">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.6" stroke-linecap="round"><circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2M19 8v6M22 11h-6"/></svg>
        <div style="flex:1;font-weight:700;font-size:17px;line-height:1.25">Add your major and interests so classmates can find you.</div>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round"><path d="m9 18 6-6-6-6"/></svg>
      </div>

      <div class="card" style="margin-top:22px;padding:20px;background:var(--focus)">
        <div class="row" style="justify-content:space-between;align-items:flex-start">
          <div>
            <div style="font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Today's focus</div>
            <div style="font:700 44px/1.1 'JetBrains Mono',monospace;margin-top:6px">1h 25m</div>
            <div style="font-size:15px;font-weight:500;margin-top:4px">of your 2h daily goal</div>
          </div>
          <span class="pill">🔥 5 days</span>
        </div>
        <div style="margin-top:16px;height:18px;border:3px solid var(--ink);border-radius:9px;background:#fff;overflow:hidden"><div style="width:70%;height:100%;background:var(--ink)"></div></div>
        <div class="row" style="margin-top:16px;justify-content:center;height:54px;border:3px solid var(--ink);border-radius:14px;background:var(--ink);color:#fff;font-weight:700;font-size:17px;box-shadow:4px 4px 0 #fff8ec, 4px 4px 0 3px var(--ink)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M7 4v16l13-8z"/></svg>Start a 25 min session
        </div>
      </div>

      <div class="row" style="margin-top:28px;justify-content:space-between">
        <div style="font-size:22px;font-weight:700">Partners for you</div>
        <div style="font-size:15px;font-weight:700;text-decoration:underline">See all</div>
      </div>
      <div class="row" style="margin-top:14px;gap:16px">
        <div class="card" style="flex:1;padding:14px">
          <div class="row"><div class="avatar" style="background:var(--chat)">MR</div><div><div style="font-weight:700;font-size:17px">Maya R.</div><span class="pill" style="background:var(--match);font-size:12px;padding:2px 8px">92%</span></div></div>
        </div>
        <div class="card" style="flex:1;padding:14px">
          <div class="row"><div class="avatar" style="background:var(--live)">JT</div><div><div style="font-weight:700;font-size:17px">Jon T.</div><span class="pill" style="background:var(--match);font-size:12px;padding:2px 8px">87%</span></div></div>
        </div>
      </div>
    </div>
    <div id="tabs">
      <div class="on"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.6" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z"/></svg></div>
      <div><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.6"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg></div>
      <div><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.6" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
      <div><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2.6"><circle cx="9" cy="8" r="4"/><circle cx="17" cy="10" r="3"/><path d="M2 21a7 7 0 0 1 14 0M16 15a5 5 0 0 1 6 5"/></svg></div>
      <div><svg width="24" height="24" viewBox="0 0 24 24" fill="#111"><circle cx="5" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="19" cy="12" r="2.2"/></svg></div>
    </div>
  `;
})();
