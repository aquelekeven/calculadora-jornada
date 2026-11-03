// Configuração pública do Supabase.
// Nunca coloque service_role ou chave secreta neste arquivo.

window.JFB_CONFIG = {
  supabaseUrl: "https://kvcoqvbwzabrxlvndvnc.supabase.co",
  supabasePublishableKey: "sb_publishable_lvpGfl9F16cvhia7NwaBXw__scrmizA",
  googleClientId: "137434218670-n29h1tesqkc21oa1h8asrunivglbj8c7.apps.googleusercontent.com"
};

(function loadAppAddons() {
  const loadAddon = ({ src, dataAttribute, warning }) => {
    if (document.querySelector(`script[${dataAttribute}]`)) return;

    const script = document.createElement('script');
    script.src = src;
    script.setAttribute(dataAttribute, 'true');
    script.async = true;
    script.onerror = () => console.warn(warning);
    document.head.appendChild(script);
  };

  const load = () => {
    loadAddon({
      src: './leave-statuses.js?v=2.14-leave-statuses',
      dataAttribute: 'data-jfb-leave-statuses',
      warning: 'Não foi possível carregar o módulo de férias e folgas.'
    });

    loadAddon({
      src: './today-query-history.js?v=2.15-today-history',
      dataAttribute: 'data-jfb-today-query-history',
      warning: 'Não foi possível carregar o histórico diário de consultas.'
    });
  };

  if (document.readyState === 'complete') {
    window.setTimeout(load, 0);
  } else {
    window.addEventListener('load', load, { once: true });
  }
})();
