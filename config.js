// Configuração pública do Supabase.
// Nunca coloque service_role ou chave secreta neste arquivo.

window.JFB_CONFIG = {
  supabaseUrl: "https://kvcoqvbwzabrxlvndvnc.supabase.co",
  supabasePublishableKey: "sb_publishable_lvpGfl9F16cvhia7NwaBXw__scrmizA",
  googleClientId: "137434218670-n29h1tesqkc21oa1h8asrunivglbj8c7.apps.googleusercontent.com"
};

(function loadLeaveStatusesAddon() {
  const load = () => {
    if (document.querySelector('script[data-jfb-leave-statuses]')) return;

    const script = document.createElement('script');
    script.src = './leave-statuses.js?v=2.14-leave-statuses';
    script.dataset.jfbLeaveStatuses = 'true';
    script.async = true;
    script.onerror = () => {
      console.warn('Não foi possível carregar o módulo de férias e folgas.');
    };
    document.head.appendChild(script);
  };

  if (document.readyState === 'complete') {
    window.setTimeout(load, 0);
  } else {
    window.addEventListener('load', load, { once: true });
  }
})();
