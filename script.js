const OPENWEATHERMAP_API_KEY = '/current.json or /current.xml';

document.addEventListener('DOMContentLoaded', () => {
  bindUI();
  initAutoFeatures();
});

function bindUI(){
  const openChatBtns = document.querySelectorAll('#openChatBtn, #openChatBtnLocal');
  openChatBtns.forEach(b => b && b.addEventListener('click', openChat));
  const floating = document.getElementById('floatingChatBtn');
  if (floating) floating.addEventListener('click', openChat);

  const voiceHeaderBtn = document.getElementById('voiceSearchBtn');
  if (voiceHeaderBtn) voiceHeaderBtn.addEventListener('click', startVoiceSearchFromHeader);

  const startVoiceBtn = document.getElementById('startVoiceBtn');
  if (startVoiceBtn) startVoiceBtn.addEventListener('click', startVoiceSearch);

  const stopVoiceBtn = document.getElementById('stopVoiceBtn');
  if (stopVoiceBtn) stopVoiceBtn.addEventListener('click', stopVoiceSearch);

  const fetchWeatherBtn = document.getElementById('fetchWeatherBtn');
  if (fetchWeatherBtn) fetchWeatherBtn.addEventListener('click', fetchWeatherFromInput);

  const voiceBtns = document.querySelectorAll('#voiceSearchBtnLocal, #voiceSearchAgr');
  voiceBtns.forEach(b => b && b.addEventListener('click', startVoiceSearch));

  window.demonstrateBlockchain = demoBlockchain;
  window.demonstrateDrone = demoDrone;
  window.demonstrateML = demoML;
  window.demonstrateIoT = demoIoT;
}

let recognition = null;
let recognizing = false;

function createRecognition(){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  const r = new SpeechRecognition();
  r.lang = 'hi-IN';
  r.interimResults = false;
  r.maxAlternatives = 1;
  r.continuous = false;
  return r;
}

function startVoiceSearchFromHeader(){
  const langSelect = document.getElementById('voiceLang');
  if (langSelect && langSelect.value && langSelect.value.toLowerCase().includes('english')){
    if (recognition) recognition.lang = 'en-US';
  }
  startVoiceSearch();
}

function startVoiceSearch(){
  if (!recognition) recognition = createRecognition();
  if (!recognition) {
    showVoiceHint('Voice search not supported in this browser. Use Chrome / Edge.');
    return;
  }
  recognition.onstart = () => {
    recognizing = true;
    showVoiceHint('Listening...');
  };
  recognition.onerror = (e) => {
    recognizing = false;
    showVoiceHint('Recognition error: ' + (e.error || 'unknown'));
  };
  recognition.onend = () => {
    recognizing = false;
    showVoiceHint('Ready');
  };
  recognition.onresult = (ev) => {
    const transcript = ev.results[0][0].transcript.trim();
    showVoiceResult(transcript);
    handleVoiceIntent(transcript);
  };
  recognition.start();
}

function stopVoiceSearch(){
  if (recognition && recognizing) {
    recognition.stop();
    recognizing = false;
    showVoiceHint('Stopped');
  }
}

function showVoiceHint(text){
  const el = document.getElementById('voiceHint');
  if (el) el.textContent = text;
}
function showVoiceResult(text){
  const el = document.getElementById('voiceResult');
  if (el) el.textContent = text;
}

function handleVoiceIntent(text){
  const t = text.toLowerCase();
  if (t.includes('weather') || t.includes('मौसम') || t.includes('बारिश') || t.includes('rain') ) {
    let tokens = text.split(' ');
    let location = tokens.slice(-2).join(' ');
    showVoiceHint('Fetching weather for: ' + location);
    fetchWeather(location);
    speakText('Fetching weather for ' + location, 'en-US');
    return;
  }
  if (t.includes('scheme') || t.includes('योजना') || t.includes('pm-kisan')) {
    speakText('Opening schemes page', 'hi-IN');
    window.location.href = 'schemes.html';
    return;
  }
  if (t.includes('health') || t.includes('स्वास्थ्य')) {
    speakText('Opening health dashboard', 'hi-IN');
    window.location.href = 'health.html';
    return;
  }
  speakText('मैं आपकी मदद कर रहा हूँ। Preparing results for: ' + text, 'hi-IN');
}

function speakText(text, lang='hi-IN'){
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 1;
  u.pitch = 1;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

async function fetchWeatherFromInput(){
  const input = document.getElementById('weatherLocation');
  if (!input) return;
  const loc = input.value.trim();
  if (!loc) {
    alert('Please enter a city name or pin code.');
    return;
  }
  await fetchWeather(loc);
}

async function fetchWeather(location){
  const output = { temp: '--', description: '--', rain: '--', wind: '--' };
  try{
    if (OPENWEATHERMAP_API_KEY && OPENWEATHERMAP_API_KEY.length > 5){
      const q = encodeURIComponent(location);
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${q}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Weather API error: ' + resp.status);
      const data = await resp.json();
      output.temp = Math.round(data.main.temp) + '°C';
      output.description = data.weather && data.weather[0] ? data.weather[0].description : 'Clear';
      if (data.rain && data.rain['1h']) output.rain = data.rain['1h'] + ' mm (1h)';
      else if (data.rain && data.rain['3h']) output.rain = data.rain['3h'] + ' mm (3h)';
      else output.rain = '0 mm';
      output.wind = Math.round(data.wind.speed) + ' m/s';
      updateWeatherUI(output);
      return output;
    } else {
      const mock = { temp: '28°C', description: 'साफ आसमान - Clear Sky', rain: '0 mm', wind: '3 m/s' };
      updateWeatherUI(mock);
      return mock;
    }
  } catch (err) {
    console.error('fetchWeather error', err);
    const fallback = { temp: 'N/A', description: 'Unable to fetch', rain:'--', wind:'--' };
    updateWeatherUI(fallback);
    return fallback;
  }
}

function updateWeatherUI(obj){
  const elTemp = document.getElementById('w_temp');
  const elDesc = document.getElementById('w_desc');
  const elRain = document.getElementById('w_rain');
  const elWind = document.getElementById('w_wind');
  if (elTemp) elTemp.textContent = obj.temp || '--';
  if (elDesc) elDesc.innerHTML = `<span class="status-indicator status-good"></span> ${obj.description || '--'}`;
  if (elRain) elRain.textContent = obj.rain || '--';
  if (elWind) elWind.textContent = obj.wind || '--';
}

function openChat(){
  if (document.getElementById('chatWindow')) return;
  const chatWindow = document.createElement('div');
  chatWindow.id = 'chatWindow';
  chatWindow.className = 'chat-window';
  chatWindow.innerHTML = `
    <div class="chat-header">
      <div class="chat-title">🤖 Grameen Sathi+ AI</div>
      <button id="closeChatBtn" class="chat-close" aria-label="Close chat">×</button>
    </div>
    <div id="chatMessages" class="chat-messages">
      <div class="chat-message ai">नमस्ते! मैं आपका AI सहायक हूँ। How can I help?</div>
    </div>
    <div class="chat-inputbar">
      <input id="chatInput" class="chat-input" placeholder="Type your query..." />
      <button id="sendChatBtn" class="primary">Send</button>
    </div>
  `;
  document.body.appendChild(chatWindow);
  document.getElementById('closeChatBtn').addEventListener('click', ()=>chatWindow.remove());
  document.getElementById('sendChatBtn').addEventListener('click', sendChatMessage);
  document.getElementById('chatInput').addEventListener('keypress', (e)=>{ if (e.key === 'Enter') sendChatMessage(); });
}

function sendChatMessage(){
  const input = document.getElementById('chatInput');
  const messages = document.getElementById('chatMessages');
  if (!input || !messages) return;
  const text = input.value.trim();
  if (!text) return;
  messages.innerHTML += `<div class="chat-line user"><div class="chat-bubble user">${escapeHtml(text)}</div></div>`;
  messages.scrollTop = messages.scrollHeight;
  input.value = '';
  setTimeout(()=> {
    const reply = generateAssistantReply(text);
    messages.innerHTML += `<div class="chat-line ai"><div class="chat-bubble ai">🤖 ${escapeHtml(reply)}</div></div>`;
    messages.scrollTop = messages.scrollHeight;
  }, 700);
}

function generateAssistantReply(userText){
  const t = userText.toLowerCase();
  if (t.includes('weather') || t.includes('मौसम')) return 'Tell me the city name or pin code to fetch the weather.';
  if (t.includes('pm-kisan') || t.includes('scheme') || t.includes('योजना')) return 'You can apply for schemes on the Gov portal. I can help pre-fill the form in demo.';
  if (t.includes('health') || t.includes('doctor')) return 'Opening health resources...';
  return 'I am preparing a recommendation for you. (Demo reply)';
}

function escapeHtml(str){
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function demoBlockchain(){
  showModal('Blockchain Water Quality Record', {
    'Block Hash':'0x7a8b9c2d3e4f5a6b7c8d9e0f1a2b3c4d',
    'Timestamp': new Date().toISOString(),
    'pH Level':'7.2',
    'TDS':'320 ppm',
    'Verified By':'IoT Sensor #WQ-001'
  });
}
function demoDrone(){
  showModal('Drone Monitoring Results', {
    'Area Covered':'247 acres',
    'Flight Time':'45 minutes',
    'Images Captured':'1,247 high-res photos',
    'Disease Detected':'Leaf spot on 12% area'
  });
}
function demoML(){
  showModal('Computer Vision Detection', {
    'Disease':'Bacterial Leaf Blight',
    'Confidence':'94.7%',
    'Treatment':'Copper oxychloride spray'
  });
}
function demoIoT(){
  showModal('5G IoT Network Performance', {
    'Network Speed':'1.2 Gbps',
    'Latency':'1ms',
    'Connected Devices':'15,847 sensors',
    'Throughput':'2.3TB/hour'
  });
}

function showModal(title, data){
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">${escapeHtml(title)}</h3>
        <button id="closeModalBtn" class="modal-close" aria-label="Close modal">Close</button>
      </div>
      <div class="modal-body">
        ${Object.entries(data).map(([k,v]) => `
          <div class="modal-row">
            <strong class="modal-key">${escapeHtml(k)}</strong>
            <span class="modal-value">${escapeHtml(v)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('closeModalBtn').addEventListener('click', ()=>modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

function updateIoTStatus(){
  const sensorW = document.getElementById('sensorW');
  const sensorWea = document.getElementById('sensorWea');
  const sensorSoil = document.getElementById('sensorSoil');
  const options = [
    {w:'12/15', wea:'4/6', soil:'8/8'},
    {w:'14/15', wea:'5/6', soil:'8/8'},
    {w:'11/15', wea:'3/6', soil:'7/8'},
    {w:'12/15', wea:'4/6', soil:'8/8'}
  ];
  const pick = options[Math.floor(Math.random()*options.length)];
  if (sensorW) sensorW.textContent = pick.w;
  if (sensorWea) sensorWea.textContent = pick.wea;
  if (sensorSoil) sensorSoil.textContent = pick.soil;
}

function initAutoFeatures(){
  setInterval(() => {
    const container = document.getElementById('notifications');
    if (!container) return;
    const tips = [
      "🌾 Use neem oil for aphids.",
      "💧 Clean water storage weekly.",
      "🔆 Apply precision irrigation to save water.",
      "💰 Check solar pump subsidy before end of year."
    ];
    const tip = tips[Math.floor(Math.random()*tips.length)];
    const node = document.createElement('div');
    node.className = 'alert-item alert-info';
    node.innerHTML = `<div class="alert-emoji">🧠</div><div class="alert-content"><div class="alert-title">AI Tip</div><div class="alert-desc">${escapeHtml(tip)}</div></div><div class="alert-time">Now</div>`;
    container.insertBefore(node, container.firstChild);
    const items = container.querySelectorAll('.alert-item');
    if (items.length > 8) container.removeChild(items[items.length-1]);
  }, 18000);
  setInterval(updateIoTStatus, 5000);
}

function simulateTelemedicine(){
  alert('Demo: Launching eSanjeevani integrated session (simulated).');
}

window.openChat = openChat;
window.startVoiceSearch = startVoiceSearch;
window.stopVoiceSearch = stopVoiceSearch;
window.fetchWeather = fetchWeather;
window.updateIoTStatus = updateIoTStatus;

const DEMO_USERS = [
  { email: 'farmer@example.com', password: 'farm1234', role: 'farmer', name: 'Ram Kisan' },
  { email: 'admin@example.com', password: 'admin1234', role: 'admin', name: 'Site Admin' }
];

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('loginEmail');
  const pwInput = document.getElementById('loginPassword');
  const rememberChk = document.getElementById('rememberMe');
  const pwToggle = document.getElementById('pwToggle');
  const loginMessage = document.getElementById('loginMessage');
  const demoQuick = document.getElementById('demoQuick');

  try {
    const remembered = localStorage.getItem('grameen_remember');
    if (remembered) {
      const obj = JSON.parse(remembered);
      if (obj.email) emailInput.value = obj.email;
      rememberChk.checked = true;
    }
  } catch (e) {}

  if (pwToggle) pwToggle.addEventListener('click', () => {
    const isPw = pwInput.type === 'password';
    pwInput.type = isPw ? 'text' : 'password';
    pwToggle.textContent = isPw ? 'Hide' : 'Show';
    pwToggle.setAttribute('aria-pressed', String(isPw));
    pwInput.focus();
  });

  if (demoQuick) demoQuick.addEventListener('click', () => {
    emailInput.value = 'farmer@example.com';
    pwInput.value = 'farm1234';
    if (loginMessage) loginMessage.innerHTML = '<div class="muted-block">Filled demo credentials — click Sign in.</div>';
  });

  if (loginForm) loginForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    clearMessage();
    const identifier = (emailInput.value || '').trim();
    const password = (pwInput.value || '').trim();
    if (!identifier || !password) {
      showError('Please enter email/phone and password.');
      if (!identifier) emailInput.focus(); else pwInput.focus();
      return;
    }
    setLoading(true, 'Signing in...');
    try {
      await sleep(650);
      const found = DEMO_USERS.find(u => u.email.toLowerCase() === identifier.toLowerCase() || u.email === identifier || u.phone === identifier);
      if (!found || found.password !== password) {
        showError('Invalid credentials. Use demo credentials shown on the left, or contact admin.');
        setLoading(false);
        return;
      }
      const session = { email: found.email, name: found.name, role: found.role, ts: new Date().toISOString() };
      sessionStoreSave(session);
      if (rememberChk && rememberChk.checked) {
        localStorage.setItem('grameen_remember', JSON.stringify({ email: found.email }));
      } else {
        localStorage.removeItem('grameen_remember');
      }
      showSuccess(`Welcome back, ${found.name}. Redirecting to dashboard...`);
      setTimeout(() => { window.location.href = 'index.html'; }, 900);
    } catch (err) {
      showError('An unexpected error occurred. Try again.');
    } finally {
      setLoading(false);
    }
  });
});

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function setLoading(isLoading, message = '') {
  const loginBtn = document.getElementById('loginBtn');
  if (!loginBtn) return;
  if (isLoading) {
    loginBtn.disabled = true;
    loginBtn.textContent = message || 'Signing in...';
    loginBtn.style.opacity = '0.85';
  } else {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign in';
    loginBtn.style.opacity = '';
  }
}

function showError(msg) {
  const el = document.getElementById('loginMessage');
  if (!el) return;
  el.innerHTML = `<div class="error" role="alert">${escapeHtml(msg)}</div>`;
}

function showSuccess(msg) {
  const el = document.getElementById('loginMessage');
  if (!el) return;
  el.innerHTML = `<div class="success" role="status">${escapeHtml(msg)}</div>`;
}

function clearMessage(){
  const el = document.getElementById('loginMessage');
  if (el) el.innerHTML = '';
}

function sessionStoreSave(sessionObj) {
  try { localStorage.setItem('grameen_session_demo', JSON.stringify(sessionObj)); } catch (e) {}
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('grameen_session_demo');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function requireLogin(redirectBack = true) {
  const user = getCurrentUser();
  if (!user) {
    const next = redirectBack ? '?next=' + encodeURIComponent(window.location.pathname + window.location.search) : '';
    window.location.href = 'login.html' + next;
    return false;
  }
  return true;
}

function logoutDemo(redirectTo = 'login.html') {
  try { localStorage.removeItem('grameen_session_demo'); } catch (e) {}
  window.location.href = redirectTo;
}

document.addEventListener('click', function (e) {
  const t = e.target;
  if (t && t.id === 'logoutBtn') {
    e.preventDefault();
    logoutDemo('login.html');
  }
});
