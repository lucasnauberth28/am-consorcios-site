# Migração para o novo domínio

De `amconsorcios.com` (AM Consórcios e Investimentos) para `amassessoriapatrimonial.com.br` (AM Assessoria Patrimonial), por exigência de regras do Banco Central. O nome da marca já foi trocado no código e o build usa o domínio novo por padrão. O pacote publicado em 20/10/2026 (`am-site-producao-2026-10-20.zip`) é idêntico ao `python scripts/build-hostinger.py` gerado a partir da `main` nesse estado (conferido arquivo a arquivo em 10/11/2026).

## O que no código depende do domínio

O código já está com `amassessoriapatrimonial.com.br` e `adm@amassessoriapatrimonial.com.br`. Para gerar com outro endereço, sem editar página por página:

```
python scripts/build-hostinger.py --dominio=OUTRODOMINIO --email=contato@OUTRODOMINIO
```

- canonical, `og:url`, `og:image` e JSON-LD de todas as páginas;
- `sitemap.xml` e `robots.txt`;
- e-mail de contato publicado no rodapé e nas páginas legais (`--email`, só se o e-mail mudar);
- rodapé do PDF do simulador da equipe;
- `.htaccess` de produção: redireciona `http://` e `www.` para `https://amassessoriapatrimonial.com.br`, mantendo o caminho.

Fora do Git, no servidor: `am-private/config.php` tem `site_origin`. A API dos leads recusa envios cuja origem seja diferente desse valor, então o formulário **para de funcionar** se ele continuar `https://amconsorcios.com`.

## Passo a passo na Hostinger

1. **Backup** do site atual: arquivos de `public_html`, a pasta `am-private/` (config, `senha.json`, `state/`) e exportação do banco MySQL.
2. **Domínio novo como site**: no hPanel, adicionar o domínio novo como site no mesmo plano. Ele ganha a própria pasta `domains/amassessoriapatrimonial.com.br/public_html`.
3. **DNS**: comprado na própria Hostinger, os nameservers já apontam para ela. Conferir que o domínio está ligado à hospedagem e esperar a propagação.
4. **SSL**: instalar o certificado gratuito para o domínio novo e para `www`. A área da equipe e o formulário exigem HTTPS.
5. **Configuração privada**: copiar `am-private/` para um nível acima do `public_html` do domínio novo (`domains/amassessoriapatrimonial.com.br/am-private/`). Alterar só `site_origin` para `https://amassessoriapatrimonial.com.br` e manter `base_path` vazio. **Não trocar `data_key`**: os leads gravados ficam ilegíveis sem ela. O mesmo banco pode continuar em uso.
6. **Publicar** o pacote de `python scripts/build-hostinger.py` no `public_html` do domínio novo.
7. **Testar** no domínio novo: páginas, vídeos, simuladores, envio do formulário (contato fictício), login em `/admin/leads/`, simulador da equipe e PDF, troca de senha, logout, `http://` e `www.` caindo em `https://amassessoriapatrimonial.com.br`.
8. **Domínio antigo**: substituir o `.htaccess` do `public_html` antigo por um redirecionamento 301 para o novo (abaixo). Manter o domínio antigo registrado por pelo menos um ano, para links salvos, buscas e QR codes não quebrarem. Se a regra do Banco Central não permitir nem o redirecionamento, deixar uma página simples de "mudamos de endereço" sem marca de consórcio.
9. **Cron de limpeza**: se `purge-hostinger.php` roda por cron, apontar o caminho para o `am-private/` novo.
10. **Google**: Search Console com a propriedade nova, enviar o sitemap e usar a "Mudança de endereço" na propriedade antiga. Atualizar o Perfil da Empresa no Google.

### Redirecionamento do domínio antigo

`.htaccess` no `public_html` de `amconsorcios.com`:

```
RewriteEngine On
RewriteCond %{HTTP_HOST} ^(www\.)?amconsorcios\.com$ [NC]
RewriteRule ^(.*)$ https://amassessoriapatrimonial.com.br/$1 [R=301,L]
```

## Fora do site (cliente)

- E-mail: o site agora publica `adm@amassessoriapatrimonial.com.br`. Criar essa caixa no domínio novo e encaminhar `adm@amconsorcios.com` para ela.
- Bio do Instagram, WhatsApp Business, anúncios, cartões, assinaturas de e-mail e QR codes impressos.
