# AM Consórcios e Investimentos

Código do site institucional, simulador e demonstração de leads. Destino solicitado: repositório GitHub **público**, conforme autorização atual, hospedagem final na Hostinger.

## Estado desta entrega

- Política de Privacidade fornecida pela AM, data 05/10/2026, em `dist/politica-de-privacidade.html`.
- Termos de Uso em `dist/termos-de-uso.html`: **minuta identificada, pendente de aprovação da AM**. Aprovar a redação antes de publicá-la como termos oficiais.
- Links locais de privacidade e termos nos rodapés institucionais; ciência da política no formulário.
- WhatsApp atualizado para o número informado pela AM: (11) 99608-6204.
- CI de testes e build no GitHub; o workflow gera um artefato, **não faz deploy**.

## Validação local

Node.js 22. Executar `npm ci`, `npm test` e `npm run build`.
O frontend compilado fica em `dist/client`; o backend original fica em `dist/server`.

## Compatibilidade com a Hostinger

A parte visual é HTML/CSS/JavaScript. O backend em `worker/index.js` depende de Cloudflare Workers, banco D1, criptografia de dados e identidade autenticada do operador fornecida pela plataforma original. Ele **não funciona ao ser copiado diretamente para uma hospedagem PHP da Hostinger**.

Antes da migração, confirmar plano e recursos disponíveis, adaptar os endpoints `/api/briefings`, `/api/briefings/status` e `/api/briefings` e a autenticação de `/briefings`, configurar banco e segredos fora do repositório, testar persistência e controle de acesso. Não substituir a autenticação do operador por um cabeçalho que o visitante possa enviar.

`/admin/leads/` é somente demonstração com dados fictícios, não é o cadastro de leads reais. O formulário depende da API e não deve ser apresentado como operacional sem validar o backend.

A conexão GitHub/Hostinger ainda não foi configurada. Não substituir o site antigo antes de backup e validação em ambiente de teste. O repositório é público; nenhum segredo ou dado real deve ser incluído. Acesso de implantação deve ser limitado a este projeto. Nenhum segredo ou dado real de lead acompanha esta entrega.
