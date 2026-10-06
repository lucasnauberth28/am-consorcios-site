# AM — painel protegido, leads e SEO

Implementação em 06/10/2026. Hospedagem mantida na Hostinger. Repositório público contém somente código e exemplos vazios; credenciais ficam fora de `public_html` e do Git.

## Funcionamento

1. Formulário envia o briefing à API PHP no mesmo domínio, com consentimento, validação no servidor, limite de tamanho, honeypot e limite de envios.
2. A API grava em MySQL antes de confirmar sucesso. Dados pessoais são criptografados com AES-256-GCM; a chave fica fora do banco. Nome, CPF e demais dados não vão para logs.
3. Somente após confirmação, o visitante pode continuar no WhatsApp. CPF e nascimento não entram na mensagem.
4. Equipe abre `/admin/leads/`, entra com usuário e senha, consulta contatos, altera situação, abre WhatsApp e pode excluir um contato.
5. Não existem leads fictícios nem persistência em localStorage/sessionStorage no painel real. Dados consultados ficam em memória apenas enquanto a tela está aberta.

A autenticação não consulta banco: usa hash de senha em configuração privada, `password_verify`, sessão PHP no servidor, cookie HttpOnly/Secure/SameSite=Strict, renovação de ID após login e token CSRF para mudanças. Expira após 30 minutos sem atividade ou 8 horas de sessão. Trocar o hash invalida sessões existentes. Limite: 8 tentativas por rede a cada 15 minutos. HTTPS obrigatório.

Um único usuário/senha representa a conta AM. Logs registram eventos dessa conta, não conseguem distinguir pessoas que compartilham a senha. Para auditoria por colaborador, futuramente usar contas individuais. Não há cadastro ou recuperação pública de senha.

Sem configuração, retorna 503 e nega acesso. Sem sessão, a API não lista, altera ou exclui leads. `_server/` e `_panel.html` são bloqueados por `.htaccess`; o painel é entregue apenas pelo PHP após autenticação. Desabilitar cache/CDN/LiteSpeed em `/admin/`, `/api/` e `/_server/`.

## Ativação no hPanel

O plano Premium já utilizado inclui banco MySQL dentro da hospedagem: custo adicional estimado de infraestrutura **R$ 0/mês**, respeitando os limites contratados. A tabela atual da Hostinger lista até 10 bancos e 3 GB por banco no Premium; planos antigos podem ter limites diferentes. Verificar os limites da conta antes de ativar. Implementação e sustentação continuam sendo trabalho técnico, não assinatura de banco externo.

1. Sites → gerenciar AM → Bancos de dados → Gerenciamento → criar banco e usuário. Guarde nome COMPLETO com prefixo, usuário, senha e host exibidos no painel. Não reutilize o banco do site antigo.
2. Abrir phpMyAdmin → selecionar banco criado → Importar → importar `hostinger/schema.sql`. Não publicar o SQL no diretório do site.
3. Pelo Gerenciador de Arquivos, subir um nível acima de `public_html`. Criar `am-private/`, acessível apenas à conta de hospedagem. Criar ali `config.php` a partir de `hostinger/private/config.example.php`. Permissões recomendadas: diretório 700, arquivo 600; PHP precisa ter leitura.
4. Preencher usuário acordado com cliente, HASH da senha (nunca senha em texto), chave aleatória base64 de 32 bytes, origem `https://amconsorcios.com`, caminho `/homologacao`, credenciais MySQL. A senha administrativa deve ser longa, exclusiva e entregue por canal privado. Use PHP local/SSH com `scripts/configure-hostinger.php` para gerar configuração; entrada da senha é oculta quando o terminal suporta `stty`.
5. PHP 8.2+ no hPanel; extensões `pdo_mysql` e `openssl`. Publicar arquivos de `python scripts/build-hostinger.py --preview` pela branch `hostinger-preview` já conectada. GitHub nunca recebe a configuração real.
6. Testar login, senha errada, acesso sem sessão, cadastro fictício válido, consulta, alteração, logout e exclusão. Testes locais com PHP e MariaDB passaram para autenticação, gravação, criptografia, deduplicação, edição, exclusão e bloqueios. Conexão e escrita no MySQL da conta ainda precisam ser validadas após configurar o servidor.
7. Agendar limpeza diária: copiar `scripts/purge-hostinger.php` para `am-private/` e criar cron PHP apontando para ele. Configuração e SQL de exclusão estão no script. Confirmar caminho absoluto do PHP no hPanel. A API também remove registros vencidos a cada acesso ao banco.

Os leads ficam ativos por 30 dias, preservando a informação atual do formulário. Backups podem reter cópias por prazo adicional conforme Hostinger: documentar política de backups e testar restauração. Fazer backup de banco E chave; perder a chave torna os dados irrecuperáveis. Não substituir a chave em redeploy.

Na publicação final, alterar `base_path` para `''`, executar `python scripts/build-hostinger.py`, publicar o pacote de produção na raiz e revisar as URLs antigas antes de desativar o site atual. Não copiar o pacote de homologação para a raiz sem regenerar caminhos.

## Medição de acesso

O painel mostra quem enviou formulário, interesse, origem do CTA, horário, consentimento e situação. Não identifica uma pessoa por apenas visitar o site. Não foram instalados rastreadores. Estatísticas agregadas podem ser avaliadas no hPanel ou adicionadas separadamente. Google Search Console permite acompanhar indexação e pesquisas; requer validação do domínio. Não existe medição confiável instalada de conversão ou visitas nesta entrega.

## Auditoria SEO e compartilhamento

Verificação por HTTP e análise de código, não teste Lighthouse/CrUX: não há pontuação medida de performance ou garantia de ranking. Tanto a raiz antiga quanto a homologação não tinham canonical/Open Graph ao iniciar este ajuste.

Implementado:
- Títulos e descrições próprios para cada página. Página inicial descreve consórcio de imóveis e veículos.
- Canonical absoluto para URLs da futura produção, impedindo sinalizar homologação como página principal.
- Open Graph e Twitter cards no HTML inicial: slogan, descrição, foto existente do banner, dimensão e texto alternativo. WhatsApp não depende de JavaScript para ler essas tags.
- Na homologação, URLs de imagem e og:url apontam ao caminho efetivamente publicado; canonical continua para produção. Em produção, todos os caminhos apontam à raiz.
- Organization e WebSite em JSON-LD com informações reais da AM. Sem avaliações, endereço, certificações ou resultados inventados.
- Sitemap das páginas institucionais indexáveis e robots.txt da produção. Administração fora do sitemap, noindex e autenticação.
- Homologação com noindex em todas as páginas; não bloquear `/homologacao/` no robots da raiz enquanto se espera que o Google leia noindex.
- Simulador e termos ainda em minuta ficam noindex. Remover noindex dos termos após validação final, se desejado.

Pontos fortes: HTML estático legível sem JavaScript, conteúdo institucional claro, FAQ visível, links internos e imagens com descrições, HTTPS e marca consistente.

Próximos pontos que influenciam desempenho:
- O vídeo do banner pesa aproximadamente 4,8 MB. Medir em celular com PageSpeed Insights após produção; avaliar MP4 menor, poster primeiro e vídeo adiado em conexão lenta. Não inventar nota de Core Web Vitals.
- Validar Search Console, enviar sitemap da raiz e acompanhar páginas indexadas, pesquisas e erros. Sitemap não garante indexação.
- Fortalecer textos úteis sobre imóvel, veículo, custos, lance e contemplação, revisados pelo responsável comercial. Não prometer contemplação ou rendimento.
- Para buscas locais, confirmar endereço/área atendida e cadastro no Perfil da Empresa do Google; não adicionar localização fictícia.
- Revisar mapa de URLs do site antigo e redirecionamentos 301 na migração final para preservar links existentes. Nenhum redirect global foi aplicado agora.
- Testar prévia do WhatsApp no link publicado; aparência depende do aplicativo e cache. Foto/título/descrição configurados não garantem layout idêntico em todos os clientes. Alterações podem levar tempo a aparecer em links já compartilhados.

## Fontes oficiais

- Hostinger, limites atualizados: https://www.hostinger.com/support/6976044-parameters-and-limits-of-hosting-plans-in-hostinger/
- Hostinger, criar MySQL: https://www.hostinger.com/support/1583542-how-to-create-a-new-mysql-database-in-hostinger/
- Hostinger, importação: https://www.hostinger.com/support/1864324-how-to-upload-and-set-up-your-database-at-hostinger/
- Google, guia SEO: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google, noindex: https://developers.google.com/search/docs/crawling-indexing/block-indexing
- Open Graph: https://ogp.me/
