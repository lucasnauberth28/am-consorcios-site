<?php
require __DIR__.'/../../_server/bootstrap.php';
$dest=(($_GET['next']??'')==='simulador')?'/admin/simulador/':'/admin/leads/';
start_session();if(authenticated())redirect_to($dest);
$message='';
if($_SERVER['REQUEST_METHOD']==='POST'){
 same_origin();csrf();rate('login',8,900);
 $password=$_POST['password']??'';$user=$_POST['username']??'';
 $valid=is_string($password)&&strlen($password)<=1024&&password_verify($password,$cfg['password_hash']);
 if($valid&&is_string($user)&&hash_equals($cfg['username']??'AM',$user)){
  session_regenerate_id(true);$_SESSION=['auth'=>true,'started'=>time(),'last'=>time(),'csrf'=>bin2hex(random_bytes(32)),'version'=>hash('sha256',$cfg['password_hash'])];audit('login-success');redirect_to($dest);
 }
 audit('login-failed');$message='Confira o usuário e a senha.';
}
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self'; form-action 'self'; base-uri 'self'; frame-ancestors 'none'");
function esc(string $s): string{return htmlspecialchars($s,ENT_QUOTES,'UTF-8');}
$sim=$dest==='/admin/simulador/';
?><!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Acesso da equipe | AM Consórcios</title><link rel="icon" href="<?=esc($base)?>/assets/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&amp;family=Instrument+Sans:wght@400;500;600&amp;display=swap"><link rel="stylesheet" href="login.css"><script src="login.js" defer></script></head><body>
<section class="side" aria-label="AM Consórcios">
<a class="brand" href="<?=esc($base)?>/" aria-label="Ver o site da AM"><img src="<?=esc($base)?>/assets/am-logo-dourado.svg" alt="" width="48" height="36"><span>AM Consórcios</span></a>
<div><p class="eyebrow">Área da equipe</p><h1>Quem simulou, o que quer e o próximo passo.</h1><p class="lead">Os contatos do site e o simulador de apresentação ficam aqui, num lugar só.</p></div>
<p class="small">Acesso restrito à equipe da AM Consórcios e Investimentos.</p>
</section>
<main class="form-side">
<form method="post" class="login">
<h2>Entrar</h2>
<p class="intro">Use o usuário e a senha da equipe.</p>
<?php if($message):?><p role="alert" class="error"><?=esc($message)?></p><?php endif;?>
<input type="hidden" name="csrf" value="<?=esc($_SESSION['csrf'])?>">
<div class="fl"><input id="user" name="username" autocomplete="username" required maxlength="80" placeholder=" "><label for="user">Usuário</label></div>
<div class="fl"><input id="pass" name="password" type="password" autocomplete="current-password" required maxlength="1024" placeholder=" "><label for="pass">Senha</label><button type="button" class="eye" id="toggle-pass" aria-label="Mostrar a senha" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg></button></div>
<button class="enter"><?=$sim?'Entrar no simulador':'Entrar nos contatos'?> <span aria-hidden="true">→</span></button>
<p class="note">Por segurança, a sessão termina depois de 30 minutos sem uso. Esqueceu a senha? Fale com o responsável pelo site.</p>
</form>
</main>
</body></html>
