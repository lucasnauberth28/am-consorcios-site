<?php
require __DIR__.'/../../_server/bootstrap.php';
if(!authenticated())redirect_to('/admin/leads/login.php?next=simulador');
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
header('Cache-Control: no-store');
echo str_replace('id="logout-csrf"', 'id="logout-csrf" value="'.htmlspecialchars($_SESSION['csrf'],ENT_QUOTES,'UTF-8').'"', file_get_contents(__DIR__.'/_simulador.html'));
