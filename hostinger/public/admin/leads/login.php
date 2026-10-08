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
header("Content-Security-Policy: default-src 'self'; style-src 'self'; img-src 'self'; form-action 'self'; base-uri 'self'; frame-ancestors 'none'");
function esc(string $s): string{return htmlspecialchars($s,ENT_QUOTES,'UTF-8');}
?><!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Acesso da equipe | AM Consórcios</title><link rel="stylesheet" href="login.css"></head><body><main class="login"><img src="<?=esc($base)?>/assets/am-logo.jpeg" alt="AM Consórcios" width="80" height="80"><p class="eyebrow">ÁREA DA EQUIPE</p><h1>Boas conversas<br>começam aqui.</h1><p>Entre para acompanhar os contatos da AM.</p><form method="post"><input type="hidden" name="csrf" value="<?=esc($_SESSION['csrf'])?>"><label>Usuário<input name="username" autocomplete="username" required maxlength="80"></label><label>Senha<input name="password" type="password" autocomplete="current-password" required maxlength="1024"></label><?php if($message):?><p role="alert" class="error"><?=esc($message)?></p><?php endif;?><button>Entrar nos contatos</button></form><a href="<?=esc($base)?>/">Voltar ao site</a><small>O acesso encerra após 30 minutos sem atividade.</small></main></body></html>
