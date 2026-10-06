<?php
// Copy outside public_html to am-private/purge-hostinger.php and schedule daily via CLI.
declare(strict_types=1);
if(PHP_SAPI!=='cli')exit(1);
$c=require __DIR__.'/config.php';$d=$c['db'];
$db=new PDO('mysql:host='.$d['host'].';dbname='.$d['name'].';charset=utf8mb4',$d['user'],$d['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$db->exec('DELETE FROM am_leads WHERE expires_at <= UNIX_TIMESTAMP()');
