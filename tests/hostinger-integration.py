"""Local PHP+MariaDB security integration test. Requires PHP_BIN, PHP_EXT_DIR and a disposable MySQL at 127.0.0.1:3307 (no production data)."""
import os,subprocess,tempfile,pathlib,json,urllib.request,urllib.error,http.cookiejar,re,time,uuid,socket,atexit
root=pathlib.Path(__file__).resolve().parents[1]
php=os.environ['PHP_BIN'];ext=os.environ['PHP_EXT_DIR']
if os.environ.get('MYSQL_BIN'):
 dbproc=subprocess.Popen([os.environ['MYSQL_BIN'],'--no-defaults','--user=root','--datadir=/tmp/am-mysql-runtime/data','--skip-grant-tables','--bind-address=127.0.0.1','--port=3307','--socket=','--pid-file=/tmp/am-mysql-runtime/test.pid','--log-error=/tmp/am-mysql-runtime/test.log'],env=os.environ,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 atexit.register(lambda:(dbproc.terminate(),dbproc.wait(timeout=10)))
 time.sleep(1)
cmd=[php,'-n','-d','extension='+ext+'/pdo.so','-d','extension='+ext+'/mysqlnd.so','-d','extension='+ext+'/pdo_mysql.so']
def php_run(s):return subprocess.check_output(cmd+['-r',s],text=True,cwd=root)
php_run("$d=new PDO('mysql:host=127.0.0.1;port=3307','root','');$d->exec('CREATE DATABASE IF NOT EXISTS am_test');$d->exec('USE am_test');$d->exec(file_get_contents('hostinger/schema.sql'));$d->exec('DELETE FROM am_leads');")
subprocess.run(['python','scripts/build-hostinger.py'],cwd=root,check=True,stdout=subprocess.DEVNULL)
with tempfile.TemporaryDirectory(prefix='am-test-') as folder:
 config=pathlib.Path(folder)/'config.php'
 sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close();origin=f'http://127.0.0.1:{port}'
 password_hash=php_run("echo password_hash('test-only-long-password',PASSWORD_DEFAULT);").strip()
 config.write_text("<?php return ['site_origin'=>'"+origin+"','base_path'=>'','username'=>'AM','password_hash'=>'"+password_hash+"','data_key'=>base64_encode(str_repeat('x',32)),'environment'=>'test','db'=>['host'=>'127.0.0.1;port=3307','name'=>'am_test','user'=>'root','password'=>'']];")
 env=os.environ|{'AM_CONFIG_PATH':str(config)}
 with open(pathlib.Path(folder)/'server.log','w') as log:
  server=subprocess.Popen(cmd+['-S',f'127.0.0.1:{port}','-t',str(root/'tmp/hostinger-production')],env=env,stdout=log,stderr=log)
  try:
   jar=http.cookiejar.CookieJar();client=urllib.request.build_opener(urllib.request.ProxyHandler({}),urllib.request.HTTPCookieProcessor(jar),urllib.request.HTTPRedirectHandler())
   def request(path,method='GET',data=None,headers=None):
    h=headers or {};raw=None
    if data is not None:
     if isinstance(data,dict):raw=json.dumps(data).encode();h={'Content-Type':'application/json',**h}
     else:raw=data.encode()
    try:r=client.open(urllib.request.Request(origin+path,data=raw,method=method,headers=h),timeout=5)
    except urllib.error.HTTPError as e:r=e
    return r.status,r.read().decode(),r.headers
   for _ in range(30):
    try:status,body,_=request('/admin/leads/login.php');break
    except urllib.error.URLError:time.sleep(.1)
   assert status==200
   csrf=re.search('name="csrf" value="([a-f0-9]+)"',body)[1]
   assert request('/api/briefings.php')[0]==401
   assert request('/api/briefings.php','PATCH',{'id':str(uuid.uuid4()),'status':'Concluído'})[0]==401
   assert request('/admin/leads/login.php','POST',f'username=AM&password=test-only-long-password&csrf=bad',{'Content-Type':'application/x-www-form-urlencoded','Origin':origin})[0]==403
   assert request('/admin/leads/login.php','POST',f'username=AM&password=wrong&csrf={csrf}',{'Content-Type':'application/x-www-form-urlencoded','Origin':origin})[0]==200
   oldcookie=next(iter(jar)).value
   status,body,_=request('/admin/leads/login.php','POST',f'username=AM&password=test-only-long-password&csrf={csrf}',{'Content-Type':'application/x-www-form-urlencoded','Origin':origin})
   assert status==200 and 'Boas conversas' in body
   assert next(iter(jar)).value!=oldcookie
   assert next(iter(jar)).has_nonstandard_attr('HttpOnly')
   status,body,_=request('/api/briefings.php');assert status==200,(status,body)
   b=json.loads(body);csrf=b['csrf'];assert b['items']==[]
   p={'requestId':str(uuid.uuid4()),'name':'Contato Teste','phone':'11999990000','interest':'imovel','credit':'100-300k','timing':'avaliar-agora','experience':'primeiro','consent':True,'consentVersion':'briefing-2026-10-05-v2'}
   assert request('/api/briefings.php','POST',p,{'Origin':'https://example.com'})[0]==403
   assert request('/api/briefings.php','POST',p|{'consent':False},{'Origin':origin})[0]==422
   assert request('/api/briefings.php','POST',p|{'website':'spam'},{'Origin':origin})[0]==400
   assert request('/api/briefings.php','POST',p,{'Origin':origin})[0]==201
   assert request('/api/briefings.php','POST',p,{'Origin':origin})[0]==200
   items=json.loads(request('/api/briefings.php')[1])['items'];assert len(items)==1 and items[0]['name']==p['name']
   protected={'Origin':origin,'X-CSRF-Token':csrf}
   assert request('/api/briefings.php','PATCH',{'id':p['requestId'],'status':'Em contato'},{'Origin':origin})[0]==403
   assert request('/api/briefings.php','PATCH',{'id':p['requestId'],'status':'invalid'},protected)[0]==422
   assert request('/api/briefings.php','PATCH',{'id':p['requestId'],'status':'Em contato'},protected)[0]==200
   assert json.loads(request('/api/briefings.php')[1])['items'][0]['status']=='Em contato'
   check=php_run("$d=new PDO('mysql:host=127.0.0.1;port=3307;dbname=am_test','root','');$r=$d->query('SELECT ciphertext FROM am_leads')->fetchColumn();echo strpos($r,'Contato Teste')===false?'encrypted':'unsafe';")
   assert check=='encrypted'
   assert request('/api/briefings.php','DELETE',{'id':p['requestId']},protected)[0]==200
   assert json.loads(request('/api/briefings.php')[1])['items']==[]
   assert request('/admin/leads/logout.php','GET')[0]==405
   assert request('/admin/leads/logout.php','POST',f'csrf={csrf}',{'Content-Type':'application/x-www-form-urlencoded','Origin':origin})[0]==200
   assert request('/api/briefings.php')[0]==401
   csrf=re.search('name="csrf" value="([a-f0-9]+)"',request('/admin/leads/login.php')[1])[1]
   for _ in range(6):request('/admin/leads/login.php','POST',f'username=AM&password=wrong&csrf={csrf}',{'Content-Type':'application/x-www-form-urlencoded','Origin':origin})
   assert request('/admin/leads/login.php','POST',f'username=AM&password=wrong&csrf={csrf}',{'Content-Type':'application/x-www-form-urlencoded','Origin':origin})[0]==429
   print('PHP + MariaDB: autenticação, bloqueios, sessão, consentimento, criptografia, gravação, deduplicação, situação, exclusão, logout e limite de tentativas aprovados.')
  finally:server.terminate();server.wait(timeout=10)
