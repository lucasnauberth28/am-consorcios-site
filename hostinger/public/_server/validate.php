<?php
declare(strict_types=1);
function valid_cpf(string $v): bool {if(!preg_match('/^\d{11}$/',$v)||preg_match('/^(\d)\1{10}$/',$v))return false;for($n=9;$n<=10;$n++){$sum=0;for($i=0;$i<$n;$i++)$sum+=(int)$v[$i]*($n+1-$i);$d=($sum*10)%11;if(($d===10?0:$d)!==(int)$v[$n])return false;}return true;}
function validate_lead(array $p): array {
 $data=[];$errors=[];$limits=['interest'=>40,'name'=>100,'phone'=>20,'email'=>160,'city'=>100,'cpf'=>20,'birthDate'=>10,'credit'=>40,'monthlyBudget'=>20,'timing'=>40,'experience'=>40,'company'=>120,'businessStage'=>40,'teamSize'=>30,'note'=>600,'source'=>80,'simCredit'=>12,'simTerm'=>3,'simInstallment'=>14,'simMode'=>10,'simBid'=>3];
 foreach($limits as $k=>$max){$v=$p[$k]??'';if(!is_string($v)||strlen($v)>$max*4){$errors[$k]='Confira este campo.';$v='';}$data[$k]=trim($v);}
 foreach(['phone','cpf'] as $k)$data[$k]=preg_replace('/\D/','',$data[$k]);
 $allowed=['interest'=>['imovel','carro','investir','carta','venda','mentoria'],'credit'=>['nao-sei','ate-100k','100-300k','300-600k','600k-1m','mais-1m'],'timing'=>['planejamento','12-24','avaliar-agora'],'experience'=>['primeiro','conheco','tenho-cota'],'businessStage'=>['iniciar','organizar','desenvolver'],'teamSize'=>['1','2-5','6-20','mais-20','definir']];
 $check=function($k)use(&$errors,$data,$allowed){if(!in_array($data[$k],$allowed[$k],true))$errors[$k]='Selecione uma opção válida.';};$check('interest');
 if(strlen($data['name'])<3||!str_contains($data['name'],' '))$errors['name']='Informe seu nome e sobrenome.';
 if(!preg_match('/^[1-9]\d{9,10}$/',$data['phone']))$errors['phone']='Informe um WhatsApp com DDD.';
 if($data['email']&&!filter_var($data['email'],FILTER_VALIDATE_EMAIL))$errors['email']='Confira o e-mail.';
 if(($p['consent']??false)!==true||($p['consentVersion']??'')!=='briefing-2026-10-05-v2')$errors['consent']='Atualize a página e confirme a autorização.';
 if(!is_string($p['requestId']??null)||!preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i',$p['requestId']??''))$errors['form']='Reabra o formulário.';
 if($data['interest']==='mentoria'){$check('businessStage');$check('teamSize');if(strlen($data['company'])<2)$errors['company']='Informe a empresa.';foreach(['cpf','birthDate','credit','monthlyBudget','timing','experience'] as $k)$data[$k]='';}
 else{foreach(['credit','timing','experience'] as $k)if($data[$k]!=='')$check($k);if($data['monthlyBudget']&&(!preg_match('/^\d{1,7}(\.\d{1,2})?$/',$data['monthlyBudget'])||(float)$data['monthlyBudget']<=0||(float)$data['monthlyBudget']>1000000))$errors['monthlyBudget']='Confira o orçamento mensal.';if($data['cpf']&&!valid_cpf($data['cpf']))$errors['cpf']='Confira o CPF.';if($data['birthDate']){$d=DateTimeImmutable::createFromFormat('!Y-m-d',$data['birthDate']);if(!$d||$d->format('Y-m-d')!==$data['birthDate']||$data['birthDate']< '1900-01-01'||$data['birthDate']>gmdate('Y-m-d'))$errors['birthDate']='Confira o nascimento.';}foreach(['company','businessStage','teamSize'] as $k)$data[$k]='';}
 $sim=['simCredit'=>'/^\d{4,10}$/','simTerm'=>'/^\d{1,3}$/','simInstallment'=>'/^\d{1,8}(\.\d{1,2})?$/','simMode'=>'/^(credito|parcela)$/','simBid'=>'/^\d{1,2}$/'];
 foreach($sim as $k=>$re)if($data['interest']==='mentoria'||!preg_match($re,$data[$k]))$data[$k]='';
 if($data['simTerm']!==''&&((int)$data['simTerm']<1||(int)$data['simTerm']>420))$data['simTerm']='';
 $data['consent']=true;$data['consentVersion']='briefing-2026-10-05-v2';return [$data,$errors];
}
