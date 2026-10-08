# AM — Design system institucional

Direção: instituição financeira com linguagem editorial, hero cinematográfico, preto e dourado da marca e áreas brancas para leitura. Duas jornadas: atendimento em consórcio e mentoria para empresas.

## Identidade de origem

- Logo original: `dist/assets/am-logo.jpeg`, obtido de https://www.amconsorcios.com/logo.jpeg em 3/10/2026. Arte e proporções preservadas; o recorte no header é feito por CSS.
- Fonte de marca: Cinzel. Texto e interfaces: Inter.
- Paleta original confirmada no site e no CSS público: preto `#0A0A0A`, superfície `#1A1A1A`, branco `#FFFFFF`, dourado claro `#FFD700`, dourado `#D4AF37`, dourado escuro `#B8860B`.
- Tokens reutilizáveis: `dist/design-tokens.css`.
- Fontes: as mesmas famílias já usadas publicamente pela marca, com fallback de sistema.

## Regras visuais

- Headlines grandes, poucas palavras e espaço suficiente entre as seções.
- Dourado destaca marca e ação principal. No branco, texto dourado usa o tom escuro para melhor leitura.
- Preto ancora entrada, mentoria e rodapé. Branco organiza explicação e dúvidas.
- Imagens cinematográficas contextualizam os objetivos. Não usar retratos genéricos como se fossem o fundador ou a equipe real.
- CTAs com rótulos diretos, sem ícones decorativos ou promessas de resultado.
- Linhas e tipografia organizam informação; cards são usados apenas quando fazem sentido para a funcionalidade.
- Marca d'água tipográfica no rodapé é um tratamento do nome, não substitui o logo original.

## Componentes

Header transparente com navegação móvel; marca original; botão primário dourado; botão escuro; link de texto; soluções em abas; perguntas e termos em disclosure; linhas de princípios; módulos numerados da mentoria; vídeo com pausa; WhatsApp discreto; rail de rolagem com suporte a teclado.

## Conteúdo e dados

- Consórcio: objetivo, orçamento, custos, prazo e regras antes de uma oferta.
- Mentoria: estágio da empresa, produto, equipe, processo e acompanhamento.
- Sem catálogo com parcelas ou cotas desatualizadas, números de resultado sem confirmação ou afirmações de contemplação garantida.
- Telefone da prévia: (11) 98608-6204, exibido no site oficial. O código do site antigo usa outro número; confirmar com o cliente antes de uma publicação no domínio comercial.
- E-mail: adm@amconsorcios.com, publicado no site oficial.

## Acessibilidade e movimento

Corpo a partir de 16 px; metadados secundários a partir de 13 px; rótulos funcionais a partir de 14 px; foco visível; estados ARIA nas abas e no menu; disclosure nativo nas dúvidas; pausa do vídeo; reduced motion; fallback visível se JavaScript não executar.

A rolagem mantém o comportamento nativo de roda e toque. O rail personalizado reflete a posição, permite arraste e teclado; as âncoras usam scroll suave.

## Reuso futuro

Ao aprovar o institucional, aplicar os tokens à mesa de cenários. A mesa deve conservar a densidade própria de uma ferramenta: controles e resultados visíveis, não um hero comercial. Preservar modelos de cálculo, premissas, navegação do wizard e contraste dos gráficos.

Na apresentação, reutilizar logo, tokens, tipografia e capturas reais do site aprovado. Atualizar a apresentação somente após a validação desta direção.

## Revisão: banner e briefing (3/10/2026)

- Home com hero imersivo: vídeo existente em plano de fundo, overlay de contraste, título sobre a imagem, CTA de planejamento e escolhas rápidas. Abertura inspirada na Valence; separação visual e CTAs da BrFideliza; composição de imagens e painéis do print StriveHub. Cores da AM preservadas.
- Imagens novas em WebP: veículo genérico e reunião empresarial fictícia. São ilustrações de contexto, não retratos da equipe real ou produtos em estoque.
- Componentes específicos: `banner.css`, `briefing.css` e modal nativo em `briefing.js`.
- Quatro etapas: objetivo → plano → contato → revisão. Mentoria substitui perguntas de crédito por empresa, estágio e equipe.
- Nome e WhatsApp são obrigatórios; e-mail, cidade, CPF, nascimento e observação são opcionais. CPF e data ficam em disclosure e são removidos do percurso de mentoria. Validação no navegador e no servidor; consentimento explícito antes de enviar. Não há decisão de crédito ou perfil de investidor automático.
- Envio real por POST `/api/briefings`, gravação no Cloudflare D1 e criptografia AES-GCM do conteúdo pessoal. Chave aleatória somente no ambiente de produção, sem dados pessoais em logs ou armazenamento local do navegador.
- Origem verificada, honeypot, limite de payload, limitação de frequência por fingerprint HMAC de IP e idempotência por UUID.
- Retorno de sucesso só depois da gravação. Mensagem manual de WhatsApp contém nome, objetivo e referência; não inclui CPF, nascimento, orçamento ou notas livres. Nenhuma mensagem é enviada automaticamente.
- Área de leitura `/briefings` e API de leitura restritas no servidor ao e-mail do operador configurado no ambiente e à identidade fornecida pela plataforma. Não se deve tornar essa área um arquivo público de assets.
- Briefings expiram para leitura após 30 dias. Registros expirados são removidos no próximo envio ou consulta do operador; não há job periódico de exclusão nesta fase.
- A versão permanece privada ao proprietário. Para receber público real no domínio da empresa, validar contato comercial, responsável pelo tratamento, política de privacidade, operadores autorizados e retenção; a mudança de domínio deve atualizar `AM_SITE_ORIGIN`.
- IA, notificações automáticas, WhatsApp Business API e CRM permanecem uma etapa futura. O payload identifica `deliveryMode: manual` para permitir evolução.
- Verificação: seis testes de servidor (consentimento, CPF/datas, mentoria, acesso, origem, criptografia e repetição), fluxos de aquisição e mentoria em DOM simulado, migração em SQLite, sintaxe e links locais. Não houve revisão visual em navegador por ausência de prévia compatível.

## Refinamento de movimento e proporções (3/10/2026)

- Banner: removida a assinatura de marca acima do título. Título reduzido com dois blocos de linha; quebra adaptável em ampliação de texto e telas pequenas.
- Modal ampliado a até 1180 px; 35% imagem lateral / 65% formulário em desktop. Em celular o formulário ocupa a largura toda. Nova imagem arquitetônica vertical em `modal-interior.webp`.
- Entrada do modal com fade, leve deslocamento e escala em 420 ms; fechamento com fade em 280 ms antes de remover o dialog. Transições entre etapas em 320 ms; foco retorna ao CTA depois da saída.
- Rolagem suave com Lenis, servido localmente com versão e licença no projeto. Pausado enquanto o modal abre e retomado após sua saída; área interna do formulário mantém rolagem própria. Toque continua nativo.
- Entradas por rolagem, pequenos intervalos entre os itens e feedback de hover nos CTAs. Preferência por movimento reduzido desativa suavização e animações.
- Mentoria na home: imagem limitada a 235 px em desktop, 240 px em tablet e 210 px em celular. Imagem na página dedicada limitada a 300 px (220 px no celular).

## Demonstração da área de contatos

`/admin/leads/` apresenta somente contatos fictícios, busca por nome/interesse, filtros por situação e detalhes em painel lateral. Entrada simulada, aviso por e-mail e mensagem de WhatsApp são prévias locais, sem envio ou chamadas de API. Situação e exemplos usam sessionStorage para estado explicitamente local de demonstração. A área real `/briefings` e suas proteções permanecem sob o Worker; não devem ser usadas como fonte de dados da demonstração.

## Redesign v2 (07/10/2026)

Direção aprovada no canvas de design: clareza, transparência de custos e um consultor de verdade.

- Páginas: `index.html` (principal), `imovel.html`, `automovel.html`, `empresas.html` e `contempladas.html` (tela de passagem que redireciona em 3 s para amcontempladas.com.br). `cultura.html`, `simulador.html` e `mentoria.html` passam a redirecionar para as páginas novas.
- Tipografia: Newsreader (títulos), Instrument Sans (texto) e Cinzel apenas no nome da marca. Logo vetorizado em `assets/am-logo-dourado.svg` (fundo escuro) e `assets/am-logo-dourado-escuro.svg` (fundo claro).
- Cores: branco, preto `#111111`/`#0A0A0A`, areia `#F7F5F0`, linhas `#E6E2DA`; dourado `#D4AF37` só no botão principal, ouro escuro `#8A6408` em texto pequeno sobre claro.
- Topo da principal com o vídeo (`assets/hero-film-1280.mp4`, 1,1 MB, comprimido do original) e botão de pausa; movimento reduzido respeitado.
- Calculadora transparente (crédito + taxa de administração + fundo de reserva, juros R$ 0) e simulador com lance nas páginas de produto. Premissas em `site-v2.js` (`TAXA_ADM`, `FUNDO`, taxas de financiamento): ilustrativas, a validar com a AM.
- Leads: os formulários enviam para `api/briefings.php` com nome, WhatsApp e consentimento; a simulação vai no campo `note` e a página de origem em `source`. Perguntas de horizonte e experiência ficaram opcionais no servidor. Para empresas usa o identificador técnico `mentoria`, mas o texto público é "Para empresas".
- Botão de WhatsApp fixo no canto inferior direito em todas as páginas.
- Pendências marcadas entre colchetes nas páginas: números da AM, nota e avaliações do Google, administradoras parceiras, nome e foto do Alex, depoimentos, horário, redes sociais e as premissas de taxa. Imagens geradas por IA são ilustrativas; pessoas reais da AM só com foto real.
- Política de privacidade e termos ainda usam o estilo anterior.
