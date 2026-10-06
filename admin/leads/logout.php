<?php
require __DIR__.'/../../_server/bootstrap.php';
if($_SERVER['REQUEST_METHOD']!=='POST')respond(['error'=>'Método inválido.'],405);
same_origin();csrf();audit('logout');$_SESSION=[];session_destroy();setcookie(session_name(),'', ['expires'=>time()-3600,'path'=>($base?:'').'/','secure'=>!$isLocal,'httponly'=>true,'samesite'=>'Strict']);redirect_to('/admin/leads/login.php');
