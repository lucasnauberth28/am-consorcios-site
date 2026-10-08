# AM Consórcios e Investimentos

Código do site institucional, simulador e demonstração de leads. Destino solicitado: repositório GitHub **público**, conforme autorização atual, hospedagem final na Hostinger.

## Estado desta entrega

- Redesign v2 publicado em homologação (07/10/2026): ver "Redesign v2" no `DESIGN_SYSTEM.md`.

- Política de Privacidade fornecida pela AM, data 05/10/2026, em `dist/politica-de-privacidade.html`.
- Termos de Uso em `dist/termos-de-uso.html`: **minuta identificada, pendente de aprovação da AM**. Aprovar a redação antes de publicá-la como termos oficiais.
- Links locais de privacidade e termos nos rodapés institucionais; ciência da política no formulário.
- WhatsApp atualizado para o número informado pela AM: (11) 99608-6204.
- CI de testes e build no GitHub; o workflow gera um artefato, **não faz deploy**.

## Simulador da equipe (pitch)

Fica em `/admin/simulador/`, com o mesmo login do painel de contatos (`hostinger/public/admin/simulador/`). Todo o cálculo roda no navegador; nada é gravado no servidor. O estado da simulação fica no endereço da página, para reabrir depois.

- **Bases de preço:** imóvel = Consórcio Santander (grupos 3210, 3213, 3216 e 3217, conforme os anúncios de outubro de 2026); automóvel e investimento = Servopa (premissas da planilha "Plano de investimento v6"). Premissas em `calc.js` (`BASES`) e editáveis na tela em "Premissas da administradora".
- **Conta:** feita em percentual do crédito, como as administradoras fazem. Parcela reduzida até a 60ª assembleia ou a contemplação (Santander, só sobre o fundo comum) ou até a contemplação (Servopa, parcela inteira). A diferença reduzida é diluída nas parcelas seguintes, então o total pago sempre fecha 100% + taxas. As planilhas antigas mantinham 50% durante todo o prazo e subestimavam o total pago.
- **Visões:** evolução da cota mês a mês (usar o crédito × vender a carta × manter como investimento, com pontos de virada), contemplação e lance, consórcio × financiamento e tabela ano a ano. Saídas: modo apresentação, proposta em PDF (impressão A4) e resumo pronto para WhatsApp.
- **Pendências:** prazo e taxa de automóvel na tabela Servopa (hoje: 100 meses com as premissas da planilha), índice de reajuste e rendimento de aplicação que a AM quer usar como padrão.
- Testes do cálculo: `node --test tests/simulador-calc.test.mjs` (compara com a planilha Servopa e com os anúncios Santander).

## Validação local

Node.js 22. Executar `npm ci`, `npm test` e `npm run build`.
O frontend compilado fica em `dist/client`; o backend original fica em `dist/server`.

## Compatibilidade com a Hostinger

A parte visual é HTML/CSS/JavaScript. O backend em `worker/index.js` depende de Cloudflare Workers, banco D1, criptografia de dados e identidade autenticada do operador fornecida pela plataforma original. Ele **não funciona ao ser copiado diretamente para uma hospedagem PHP da Hostinger**.

Antes da migração, confirmar plano e recursos disponíveis, adaptar os endpoints `/api/briefings`, `/api/briefings/status` e `/api/briefings` e a autenticação de `/briefings`, configurar banco e segredos fora do repositório, testar persistência e controle de acesso. Não substituir a autenticação do operador por um cabeçalho que o visitante possa enviar.

`/admin/leads/` é somente demonstração com dados fictícios, não é o cadastro de leads reais. O formulário depende da API e não deve ser apresentado como operacional sem validar o backend.

A conexão GitHub/Hostinger ainda não foi configurada. Não substituir o site antigo antes de backup e validação em ambiente de teste. O repositório é público; nenhum segredo ou dado real deve ser incluído. Acesso de implantação deve ser limitado a este projeto. Nenhum segredo ou dado real de lead acompanha esta entrega.

## Hospedagem atual: Hostinger

A implantação externa usa PHP + MySQL. Execute `python scripts/build-hostinger.py --preview` para homologação ou sem a opção para produção. A branch `hostinger-preview` contém o pacote pronto para `/homologacao/`. Não publique `dist/` diretamente na Hostinger: ele não contém o backend PHP. Consulte [guia de ativação, segurança e SEO](docs/HOSTINGER-LEADS-E-SEO.md). Credenciais ficam fora de `public_html` e do Git. O Worker original é legado da demonstração em outra hospedagem.
