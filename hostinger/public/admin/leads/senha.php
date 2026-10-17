<?php
require __DIR__.'/../../_server/bootstrap.php';
if(!authenticated())redirect_to('/admin/leads/login.php');
$message='';$done=false;
if($_SERVER['REQUEST_METHOD']==='POST'){
 same_origin();csrf();rate('senha',8,900);
 $current=$_POST['current']??'';$new=$_POST['new']??'';$confirm=$_POST['confirm']??'';
 if(!is_string($current)||!is_string($new)||!is_string($confirm)||strlen($current)>1024||strlen($new)>1024)$message='Confira os campos.';
 elseif(!check_password($current)){audit('password-change-failed');$message='A senha atual não confere.';}
 elseif((function_exists('mb_strlen')?mb_strlen($new):strlen($new))<10)$message='A nova senha precisa ter pelo menos 10 caracteres.';
 elseif($new!==$confirm)$message='A confirmação não é igual à nova senha.';
 elseif(hash_equals($current,$new))$message='Escolha uma senha diferente da atual.';
 else{
  save_password($new);
  // Outras sessões abertas caem; esta continua, já com a senha nova.
  session_regenerate_id(true);$_SESSION['version']=hash('sha256',$cfg['password_hash']);$_SESSION['csrf']=bin2hex(random_bytes(32));
  audit('password-changed');$done=true;
 }
}
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self'; form-action 'self'; base-uri 'self'; frame-ancestors 'none'");
function esc(string $s): string{return htmlspecialchars($s,ENT_QUOTES,'UTF-8');}
?><!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Trocar senha | AM Consórcios</title><link rel="icon" href="<?=esc($base)?>/assets/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&amp;family=Instrument+Sans:wght@400;500;600&amp;display=swap"><link rel="stylesheet" href="login.css"></head><body>
<section class="side" aria-label="AM Consórcios">
<a class="brand" href="<?=esc($base)?>/" aria-label="Ver o site da AM"><img src="<?=esc($base)?>/assets/am-logo-dourado.svg" alt="" width="48" height="36"><span>AM Consórcios</span></a>
<div><p class="eyebrow">Área da equipe</p><h1>Uma senha só sua.</h1><p class="lead">A senha nova vale para os contatos e para o simulador. Quem estiver com a sessão aberta em outro aparelho precisa entrar de novo.</p></div>
<p class="small">Acesso restrito à equipe da AM Consórcios e Investimentos.</p>
</section>
<main class="form-side">
<?php if($done):?>
<div class="login" role="status">
<h2>Senha trocada.</h2>
<p class="intro">A partir de agora, use a senha nova para entrar.</p>
<a class="enter" href="<?=esc($base)?>/admin/leads/">Ir para os contatos <span aria-hidden="true">→</span></a>
<p class="note"><a href="<?=esc($base)?>/admin/simulador/">Ou abrir o simulador</a></p>
</div>
<?php else:?>
<form method="post" class="login">
<h2>Trocar senha</h2>
<p class="intro">Informe a senha atual e escolha a nova.</p>
<?php if($message):?><p role="alert" class="error"><?=esc($message)?></p><?php endif;?>
<input type="hidden" name="csrf" value="<?=esc($_SESSION['csrf'])?>">
<input type="hidden" name="username" autocomplete="username" value="<?=esc($cfg['username']??'AM')?>">
<div class="fl"><input id="current" name="current" type="password" autocomplete="current-password" required maxlength="1024" placeholder=" "><label for="current">Senha atual</label></div>
<div class="fl"><input id="new" name="new" type="password" autocomplete="new-password" required minlength="10" maxlength="1024" placeholder=" "><label for="new">Nova senha (mínimo 10 caracteres)</label></div>
<div class="fl"><input id="confirm" name="confirm" type="password" autocomplete="new-password" required minlength="10" maxlength="1024" placeholder=" "><label for="confirm">Repita a nova senha</label></div>
<button class="enter">Salvar nova senha <span aria-hidden="true">→</span></button>
<p class="note"><a href="<?=esc($base)?>/admin/leads/">Voltar aos contatos</a> · Use uma senha longa, que você não usa em outros sites.</p>
</form>
<?php endif;?>
</main>
</body></html>
