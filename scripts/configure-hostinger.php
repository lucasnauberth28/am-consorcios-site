<?php
// Run on your own trusted machine/SSH. Output file is secret: never commit or publish it.
declare(strict_types=1);
if(PHP_SAPI!=='cli')exit(1);
$path=$argv[1]??'';if(!$path||file_exists($path)){fwrite(STDERR,"Informe um caminho novo e privado para config.php.\n");exit(1);}
function prompt(string $label,bool $secret=false): string {
 fwrite(STDOUT,$label.': ');$hidden=false;
 if($secret){$hidden=function_exists('shell_exec') && trim((string)shell_exec('stty -g 2>/dev/null'))!=='';if(!$hidden){fwrite(STDERR,"Use um terminal com entrada oculta para as senhas.\n");exit(1);}shell_exec('stty -echo');}
 try{$v=trim((string)fgets(STDIN));}finally{if($hidden){shell_exec('stty echo');fwrite(STDOUT,"\n");}}
 return $v;
}
$user=prompt('Usuário administrativo');$pw=prompt('Senha administrativa (mínimo 16 caracteres)',true);if(strlen($pw)<16)exit("Senha muito curta.\n");
$c=['site_origin'=>'https://amconsorcios.com','base_path'=>'/homologacao','username'=>$user,'password_hash'=>password_hash($pw,PASSWORD_DEFAULT),'data_key'=>base64_encode(random_bytes(32)),'db'=>['host'=>prompt('Host MySQL'),'name'=>prompt('Nome completo do banco'),'user'=>prompt('Usuário completo do banco'),'password'=>prompt('Senha MySQL',true)]];
umask(0077);$h=fopen($path,'x');if(!$h)exit(1);fwrite($h,"<?php\nreturn ".var_export($c,true).";\n");fclose($h);fwrite(STDOUT,"Configuração criada. Guarde-a fora de public_html e do Git.\n");
