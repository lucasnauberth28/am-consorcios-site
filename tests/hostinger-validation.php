<?php
require __DIR__.'/../hostinger/public/_server/validate.php';
function check(bool $v,string $m):void{if(!$v)throw new RuntimeException($m);}
$p=['requestId'=>'11111111-1111-4111-8111-111111111111','name'=>'Contato Teste','phone'=>'11999990000','interest'=>'imovel','credit'=>'100-300k','timing'=>'avaliar-agora','experience'=>'primeiro','consent'=>true,'consentVersion'=>'briefing-2026-10-05-v2'];
[$d,$e]=validate_lead($p);check(!$e,'valid lead');
[$d,$e]=validate_lead($p+['cpf'=>'11111111111']);check(isset($e['cpf']),'invalid CPF');
[$d,$e]=validate_lead(array_replace($p,['consent'=>false]));check(isset($e['consent']),'consent');
[$d,$e]=validate_lead($p+['birthDate'=>'2026-02-30']);check(isset($e['birthDate']),'calendar');
[$d,$e]=validate_lead(array_replace($p,['interest'=>'mentoria','company'=>'Empresa Teste','businessStage'=>'iniciar','teamSize'=>'1','cpf'=>'11111111111']));check(!$e && $d['cpf']==='','business fields');
[$d,$e]=validate_lead(array_replace($p,['interest'=>'unknown']));check(isset($e['interest']),'enum');
[$d,$e]=validate_lead(array_diff_key($p,['timing'=>1,'experience'=>1])+['note'=>'Simulação no site','source'=>'Site · simulador']);check(!$e,'simulator lead without planning questions');
[$d,$e]=validate_lead(array_replace($p,['timing'=>'qualquer']));check(isset($e['timing']),'timing enum when present');
echo "8 verificações de validação PHP aprovadas.\n";
