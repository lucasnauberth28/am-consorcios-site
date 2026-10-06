<?php
declare(strict_types=1);
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');
ini_set('display_errors', '0');
function respond(array $data, int $status=200): never {
 http_response_code($status); header('Content-Type: application/json; charset=utf-8');
 echo json_encode($data, JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR); exit;
}
set_exception_handler(function(Throwable $e): void {error_log('AM: serviço indisponível, sem registro de dados pessoais.');respond(['error'=>'Serviço indisponível. Tente novamente ou converse com a AM pelo WhatsApp.'],503);});
// Configuration must be outside public_html, including when installed in /homologacao.
$root=realpath(__DIR__.'/../..');
$domain=$root;
while(basename($domain)!=='public_html' && dirname($domain)!==$domain) $domain=dirname($domain);
$configPath=getenv('AM_CONFIG_PATH') ?: dirname($domain).'/am-private/config.php';
if(!is_file($configPath)) {
 if(str_contains($_SERVER['SCRIPT_NAME']??'', '/admin/leads/')) {
  http_response_code(503);header('Content-Type: text/html; charset=utf-8');
  echo '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Área protegida | AM</title><link rel="stylesheet" href="login.css"></head><body><main class="login"><p class="eyebrow">AM CONSÓRCIOS · ÁREA DA EQUIPE</p><h1>Acesso protegido.</h1><p>A configuração de acesso está sendo preparada. Os contatos só ficarão disponíveis após a ativação do servidor.</p><a href="../../">Voltar ao site</a></main></body></html>';exit;
 }
 respond(['error'=>'Área protegida. A configuração do servidor ainda não foi concluída.'],503);
}
$cfg=require $configPath;
$key=base64_decode($cfg['data_key']??'',true);
if(!is_array($cfg)||strlen($key?:'')!==32||empty($cfg['password_hash'])||empty($cfg['site_origin'])) throw new RuntimeException('configuration');
$private=dirname($configPath);
$state=$private.'/state';
if(!is_dir($state)&&!mkdir($state,0700,true)&&!is_dir($state)) throw new RuntimeException('state');
$base=rtrim($cfg['base_path']??'', '/');
if(!preg_match('~^(?:/[a-zA-Z0-9_-]+)*$~',$base)) throw new RuntimeException('base');
$isLocal=($cfg['environment']??'production')==='test' && in_array($_SERVER['REMOTE_ADDR']??'',['127.0.0.1','::1'],true);
if(!$isLocal && (empty($_SERVER['HTTPS'])||$_SERVER['HTTPS']==='off')) respond(['error'=>'Use a conexão HTTPS.'],400);
if(!$isLocal) header('Strict-Transport-Security: max-age=31536000');
function start_session(): void {
 global $state,$base,$isLocal;
 if(session_status()===PHP_SESSION_ACTIVE)return;
 ini_set('session.use_strict_mode','1');ini_set('session.use_only_cookies','1');
 session_save_path($state);session_name('am_admin_'.substr(hash('sha256',$base),0,10));
 session_set_cookie_params(['lifetime'=>0,'path'=>($base?:'').'/','secure'=>!$isLocal,'httponly'=>true,'samesite'=>'Strict']);
 session_start();
 if(!isset($_SESSION['csrf']))$_SESSION['csrf']=bin2hex(random_bytes(32));
}
function csrf(): void {start_session();$token=$_SERVER['HTTP_X_CSRF_TOKEN']??$_POST['csrf']??'';if(!is_string($token)||!hash_equals($_SESSION['csrf'],$token))respond(['error'=>'Atualize a página e tente novamente.'],403);}
function same_origin(): void {global $cfg,$isLocal;$origin=$_SERVER['HTTP_ORIGIN']??'';if($origin!==$cfg['site_origin']||($_SERVER['HTTP_SEC_FETCH_SITE']??'')==='cross-site')respond(['error'=>'A solicitação deve partir deste site.'],403);}
function authenticated(): bool {global $cfg;start_session();$ok=isset($_SESSION['auth'],$_SESSION['last'],$_SESSION['started'],$_SESSION['version']) && $_SESSION['auth']===true && time()-$_SESSION['last']<1800 && time()-$_SESSION['started']<28800 && hash_equals(hash('sha256',$cfg['password_hash']),$_SESSION['version']);if($ok)$_SESSION['last']=time();else unset($_SESSION['auth']);return $ok;}
function require_admin(): void {if(!authenticated())respond(['error'=>'Entre novamente para continuar.'],401);}
function redirect_to(string $path): never {global $base;header('Location: '.$base.$path, true,303);exit;}
function fingerprint(): string {global $key;return hash_hmac('sha256',$_SERVER['REMOTE_ADDR']??'unknown',$key);}
// File-backed, locked and atomic window counters; no database required for login.
function rate(string $scope,int $limit,int $window): void {
 global $state;
 $f=fopen($state.'/limit-'.$scope.'-'.fingerprint(),'c+');if(!$f||!flock($f,LOCK_EX))throw new RuntimeException('rate');
 $s=json_decode(stream_get_contents($f),true)?:['start'=>time(),'n'=>0];
 if(time()-$s['start']>=$window)$s=['start'=>time(),'n'=>0];
 if($s['n']>=$limit){flock($f,LOCK_UN);fclose($f);header('Retry-After: '.max(1,$window-(time()-$s['start'])));respond(['error'=>'Muitas tentativas. Aguarde alguns minutos.'],429);}
 $s['n']++;rewind($f);ftruncate($f,0);fwrite($f,json_encode($s));fflush($f);flock($f,LOCK_UN);fclose($f);
 // Sweep expired counters and sessions, bounded to this private directory.
 if(random_int(1,100)===1)foreach(glob($state.'/*')?:[] as $p)if(is_file($p)&&filemtime($p)<time()-86400)unlink($p);
}
function audit(string $event): void {global $state,$cfg; $line=json_encode(['at'=>gmdate('c'),'account'=>$cfg['username']??'AM','event'=>$event,'network'=>fingerprint()])."\n";file_put_contents($state.'/access-'.gmdate('Y-m-d').'.log',$line,FILE_APPEND|LOCK_EX);foreach(glob($state.'/access-*.log')?:[] as $p)if(filemtime($p)<time()-30*86400)unlink($p);}
function database(): PDO {global $cfg;static $db;if(!$db){$d=$cfg['db'];$db=new PDO('mysql:host='.$d['host'].';dbname='.$d['name'].';charset=utf8mb4',$d['user'],$d['password'],[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_EMULATE_PREPARES=>false]);}$db->exec('DELETE FROM am_leads WHERE expires_at <= UNIX_TIMESTAMP()');return $db;}
function seal(array $data,string $id): array {global $key;$iv=random_bytes(12);$cipher=openssl_encrypt(json_encode($data,JSON_THROW_ON_ERROR),'aes-256-gcm',$key,OPENSSL_RAW_DATA,$iv,$tag,$id);if($cipher===false)throw new RuntimeException('encrypt');return [base64_encode($cipher),base64_encode($iv),base64_encode($tag)];}
function unseal(array $row): array {global $key;$plain=openssl_decrypt(base64_decode($row['ciphertext']),'aes-256-gcm',$key,OPENSSL_RAW_DATA,base64_decode($row['iv']),base64_decode($row['tag']),$row['id']);if($plain===false)throw new RuntimeException('decrypt');return json_decode($plain,true,512,JSON_THROW_ON_ERROR);}
function json_body(): array {if(!str_starts_with($_SERVER['CONTENT_TYPE']??'','application/json'))respond(['error'=>'Formato inválido.'],415);$raw=file_get_contents('php://input',false,null,0,12001);if(strlen($raw)>12000)respond(['error'=>'Formulário muito grande.'],413);try{$p=json_decode($raw,true,32,JSON_THROW_ON_ERROR);}catch(Throwable $e){respond(['error'=>'Formulário inválido.'],400);}if(!is_array($p)||array_is_list($p))respond(['error'=>'Formulário inválido.'],400);return $p;}
