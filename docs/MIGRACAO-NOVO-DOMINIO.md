# Migração para o novo domínio

Domínio atual: `amconsorcios.com`. O pacote publicado em 20/10/2026 (`am-site-producao-2026-10-20.zip`) é idêntico ao `python scripts/build-hostinger.py` gerado a partir da `main` nesse estado (conferido arquivo a arquivo em 10/11/2026).

## O que no código depende do domínio

Tudo é trocado pelo build, sem editar página por página:

```
python scripts/build-hostinger.py --dominio=NOVODOMINIO --email=contato@NOVODOMINIO
```

- canonical, `og:url`, `og:image` e JSON-LD de todas as páginas;
- `sitemap.xml` e `robots.txt`;
- e-mail de contato publicado no rodapé e nas páginas legais (`--email`, só se o e-mail mudar);
- rodapé do PDF do simulador da equipe;
- `.htaccess`: com `--dominio`, passa a redirecionar `http://` e `www.` para `https://NOVODOMINIO`, mantendo o caminho.

Fora do Git, no servidor: `am-private/config.php` tem `site_origin`. A API dos leads recusa envios cuja origem seja diferente desse valor, então o formulário **para de funcionar** se ele continuar `https://amconsorcios.com`.

## Passo a passo na Hostinger

1. **Backup** do site atual: arquivos de `public_html`, a pasta `am-private/` (config, `senha.json`, `state/`) e exportação do banco MySQL.
2. **Domínio novo como site**: no hPanel, adicionar o domínio novo como site no mesmo plano. Ele ganha a própria pasta `domains/NOVODOMINIO/public_html`.
3. **DNS**: comprado na própria Hostinger, os nameservers já apontam para ela. Conferir que o domínio está ligado à hospedagem e esperar a propagação.
4. **SSL**: instalar o certificado gratuito para o domínio novo e para `www`. A área da equipe e o formulário exigem HTTPS.
5. **Configuração privada**: copiar `am-private/` para um nível acima do `public_html` do domínio novo (`domains/NOVODOMINIO/am-private/`). Alterar só `site_origin` para `https://NOVODOMINIO` e manter `base_path` vazio. **Não trocar `data_key`**: os leads gravados ficam ilegíveis sem ela. O mesmo banco pode continuar em uso.
6. **Publicar** o pacote gerado com `--dominio` no `public_html` do domínio novo.
7. **Testar** no domínio novo: páginas, vídeos, simuladores, envio do formulário (contato fictício), login em `/admin/leads/`, simulador da equipe e PDF, troca de senha, logout, `http://` e `www.` caindo em `https://NOVODOMINIO`.
8. **Domínio antigo**: substituir o `.htaccess` do `public_html` antigo por um redirecionamento 301 para o novo (abaixo). Manter o domínio antigo registrado por pelo menos um ano, para links salvos, buscas e QR codes não quebrarem. Se a regra do Banco Central não permitir nem o redirecionamento, deixar uma página simples de "mudamos de endereço" sem marca de consórcio.
9. **Cron de limpeza**: se `purge-hostinger.php` roda por cron, apontar o caminho para o `am-private/` novo.
10. **Google**: Search Console com a propriedade nova, enviar o sitemap e usar a "Mudança de endereço" na propriedade antiga. Atualizar o Perfil da Empresa no Google.

### Redirecionamento do domínio antigo

`.htaccess` no `public_html` de `amconsorcios.com`:

```
RewriteEngine On
RewriteCond %{HTTP_HOST} ^(www\.)?amconsorcios\.com$ [NC]
RewriteRule ^(.*)$ https://NOVODOMINIO/$1 [R=301,L]
```

## Fora do site (cliente)

- E-mail `adm@amconsorcios.com`: se a caixa de e-mail é do domínio antigo, criar a nova e configurar encaminhamento.
- Bio do Instagram, WhatsApp Business, anúncios, cartões, assinaturas de e-mail e QR codes impressos.
