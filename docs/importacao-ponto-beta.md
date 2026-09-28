# Importação de ponto — beta privado

Disponível em **Registrar dia → Importar print do ponto**. Liberação inicial vinculada ao ID da conta de teste confirmado no Supabase, definido em `point-ocr.js`; `RELEASE_TO_ALL` permanece `false`.

## Operação

- PNG, JPEG e WebP até 12 MB / 20 megapixels; seleção de arquivo ou colagem dentro do diálogo.
- Incluir mês/ano e os cabeçalhos Dia, Ent/Saída, Justificativa, H.Real e Saldo. Modelo inicial: tabela de marcações do portal.
- OCR em duas etapas: localização da tabela, depois leitura com contraste melhorado. Datas ambíguas recebem uma tentativa individual. Não deduz datas pela posição das linhas.
- Prévia editável por linha, seleção explícita, confirmação adicional de baixa confiança, divergência no total, pendência ou ausência.
- Não transforma totais/saldos do portal em horários de entrada/saída. Pares incompletos permanecem vazios para correção.
- Finais de semana sem marcações são ignorados; feriados e ausências são classificados para conferência. Nenhuma ausência é abonada automaticamente.
- Datas já existentes são bloqueadas, preservando horários, notas e abonos anteriores. O lote inteiro é validado antes de alterar o histórico.
- Usa as regras existentes de jornada, tolerância, feriados e finais de semana. Em marcações pendentes, calcula pelos horários confirmados e mantém uma nota da pendência; não altera o portal oficial.
- Erros de sincronização continuam no mecanismo local existente, sem apresentar confirmação indevida de sincronização.

## Autenticação, privacidade e dependências

`auth.getUser()` confirma a identidade no servidor antes de mostrar a função, ler o arquivo e salvar. Logout/troca de conta fecha o diálogo, limpa a imagem e cancela a leitura. A fila de sincronização captura o ID no início para evitar atribuir dados a uma conta diferente após troca de sessão.

É um controle de lançamento do cliente, não uma API privada de OCR: como o site é estático, o JavaScript é público e alguém pode executar um OCR por conta própria. O acesso aos dados permanece protegido pelas políticas de RLS existentes (`auth.uid() = user_id`, inclusive `WITH CHECK` de UPDATE), verificadas antes da mudança. Não houve alteração de schema, permissões ou registros reais para testar.

A imagem e o texto bruto não são enviados ao Supabase nem a serviços de IA; ficam somente na memória do navegador. Só os registros confirmados são persistidos. Os arquivos do motor/modelo são baixados sob demanda do unpkg, com versões fixadas:

- `tesseract.js@7.0.0`
- `tesseract.js-core@7.0.0`
- `@tesseract.js-data/por@1.0.0/4.0.0`

Sem cobrança por leitura; continuam aplicáveis os limites da hospedagem/banco/CDN. A primeira leitura precisa de internet e baixa vários MB. A CSP permite WebAssembly, workers e os downloads necessários, sem habilitar `unsafe-eval`. O service worker recebeu uma versão nova; não guarda prints ou respostas de autenticação.

## Verificação e liberação futura

Executar `node --test tests/point-ocr.test.cjs` e `node --check point-ocr.js`.

Foi feita verificação no Chromium com os pacotes reais de OCR e o print de referência: 26 linhas reconhecidas, prévia em desktop/celular, salvamento em conta simulada e bloqueio de outra conta. OCR pode precisar de correções em fontes pequenas, texto selecionado ou imagens borradas; reconhecimento de linha não significa precisão garantida de todos os campos. Nenhum print, token ou dado de teste pessoal está incluído no repositório.

Para liberar a todos após aprovação: alterar somente `RELEASE_TO_ALL` para `true`, atualizar as versões de cache e ajustar a indicação visual de teste. A validação da sessão, revisão e proteção contra duplicação devem permanecer. Para retirar a versão beta, reverter o commit de implantação.
