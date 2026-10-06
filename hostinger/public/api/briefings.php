<?php
require __DIR__.'/../_server/bootstrap.php';
require __DIR__.'/../_server/validate.php';
$method=$_SERVER['REQUEST_METHOD'];
if($method==='POST'){
 same_origin();rate('lead',12,3600);$p=json_body();if(!empty($p['website']))respond(['error'=>'Não foi possível enviar.'],400);
 [$data,$errors]=validate_lead($p);if($errors)respond(['error'=>'Revise os campos indicados.','fields'=>$errors],422);
 $db=database();$id=$p['requestId'];$q=$db->prepare('SELECT id,ip_hash FROM am_leads WHERE id=?');$q->execute([$id]);$old=$q->fetch(PDO::FETCH_ASSOC);
 if($old){if(!hash_equals($old['ip_hash'],fingerprint()))respond(['error'=>'Reabra o formulário para outro envio.'],409);respond(['id'=>$id,'received'=>true]);}
 [$cipher,$iv,$tag]=seal($data,$id);$q=$db->prepare('INSERT INTO am_leads (id,created_at,expires_at,ciphertext,iv,tag,ip_hash,consent_version) VALUES (?,?,?,?,?,?,?,?)');
 try{$q->execute([$id,time(),time()+30*86400,$cipher,$iv,$tag,fingerprint(),$data['consentVersion']]);}catch(PDOException $e){if($e->getCode()!=='23000')throw $e;$q=$db->prepare('SELECT ip_hash FROM am_leads WHERE id=?');$q->execute([$id]);$row=$q->fetch(PDO::FETCH_ASSOC);if(!$row||!hash_equals($row['ip_hash'],fingerprint()))respond(['error'=>'Reabra o formulário.'],409);}
 respond(['id'=>$id,'received'=>true],201);
}
require_admin();
if($method==='GET'){
 $db=database();$before=(int)($_GET['before']??(time()+1));$beforeId=$_GET['beforeId']??'zzzz';
 $q=$db->prepare('SELECT * FROM am_leads WHERE created_at<? OR (created_at=? AND id<?) ORDER BY created_at DESC,id DESC LIMIT 51');$q->execute([$before,$before,$beforeId]);$rows=$q->fetchAll(PDO::FETCH_ASSOC);$more=count($rows)>50;$rows=array_slice($rows,0,50);$items=[];
 foreach($rows as $row)$items[]=['id'=>$row['id'],'createdAt'=>(int)$row['created_at'],'status'=>$row['status']]+unseal($row);
 $last=$rows?end($rows):null;respond(['items'=>$items,'next'=>$more?['before'=>$last['created_at'],'beforeId'=>$last['id']]:null,'csrf'=>$_SESSION['csrf']]);
}
if($method==='PATCH'||$method==='DELETE'){
 same_origin();csrf();$p=json_body();$id=$p['id']??'';if(!is_string($id)||!preg_match('/^[a-f0-9-]{36}$/i',$id))respond(['error'=>'Contato inválido.'],422);
 if($method==='PATCH'){if(!in_array($p['status']??'', ['Novo','Em contato','Concluído'],true))respond(['error'=>'Situação inválida.'],422);$q=database()->prepare('UPDATE am_leads SET status=? WHERE id=?');$q->execute([$p['status'],$id]);}
 else{$q=database()->prepare('DELETE FROM am_leads WHERE id=?');$q->execute([$id]);}
 audit($method==='PATCH'?'lead-status':'lead-deleted');respond(['success'=>true]);
}
respond(['error'=>'Método inválido.'],405);
