// Paylaşım kilidi — GERÇEK güvenlik DEĞİLDİR. Bu bir istemci-taraflı statik site (backend yok),
// dolayısıyla kaynak kod herkese açık kalır ve kararlı biri tarayıcı konsolundan bu kontrolü
// atlayabilir. Amaç yalnızca: linki arayıp bulan/tesadüfen rastlayan kişileri caydırmak, sadece
// şifreyi bildiğin arkadaşların rahatça girmesini sağlamak. Şifreyi değiştirmek için: yeni şifrenin
// SHA-256 hex hash'ini hesapla (örn. tarayıcı konsolunda
// `crypto.subtle.digest('SHA-256', new TextEncoder().encode('yeniSifre')).then(b=>console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))`)
// ve aşağıdaki GATE_HASH'i onunla değiştir.
const GATE_HASH = "53d2dd2504402eec1bc49ad74daf2e90c352f399842f3d5a3606892213c110fc"; // "1453"
const GATE_STORAGE_KEY = "cs_gate_ok";

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function enforceAccessGate() {
  if (localStorage.getItem(GATE_STORAGE_KEY) === "1") return Promise.resolve();

  const overlay = document.createElement("div");
  overlay.id = "csGateOverlay";
  overlay.innerHTML = `
    <style>
      #csGateOverlay{position:fixed;inset:0;z-index:999999;background:#14121B;display:flex;align-items:center;justify-content:center;font-family:-apple-system,"Segoe UI",system-ui,sans-serif}
      #csGateOverlay .box{background:#1C1926;border:1px solid #322C42;border-radius:16px;padding:32px 30px;width:min(320px,88vw);box-shadow:0 20px 44px -20px rgba(0,0,0,.6)}
      #csGateOverlay h1{font-size:15px;color:#F1EEFA;margin:0 0 6px;font-weight:800}
      #csGateOverlay p{font-size:12px;color:#948FA8;margin:0 0 18px;line-height:1.5}
      #csGateOverlay input{width:100%;padding:10px 12px;border-radius:10px;border:1px solid #3E3752;background:#242032;color:#F1EEFA;font-size:14px;box-sizing:border-box}
      #csGateOverlay input:focus{outline:2px solid #9C7CFF;outline-offset:1px}
      #csGateOverlay button{width:100%;margin-top:10px;padding:10px;border-radius:10px;border:none;background:linear-gradient(135deg,#9C7CFF,#7C5CFC);color:#fff;font-weight:700;cursor:pointer;font-size:13px}
      #csGateOverlay .err{color:#FF5C7A;font-size:11.5px;margin-top:10px;display:none}
    </style>
    <div class="box">
      <h1>Configurator Studio</h1>
      <p>Bu erişim şifreyle sınırlıdır. Devam etmek için şifreyi gir.</p>
      <input type="password" id="csGatePass" placeholder="Şifre" autocomplete="off">
      <button id="csGateBtn">Devam Et</button>
      <div class="err" id="csGateErr">Yanlış şifre, tekrar dene.</div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById("csGatePass").focus();

  return new Promise((resolve) => {
    const tryUnlock = async () => {
      const val = document.getElementById("csGatePass").value;
      const hash = await sha256Hex(val);
      if (hash === GATE_HASH) {
        localStorage.setItem(GATE_STORAGE_KEY, "1");
        overlay.remove();
        resolve();
      } else {
        document.getElementById("csGateErr").style.display = "block";
      }
    };
    document.getElementById("csGateBtn").addEventListener("click", tryUnlock);
    document.getElementById("csGatePass").addEventListener("keydown", (e) => {
      if (e.key === "Enter") tryUnlock();
    });
  });
}
