<?php
// Copy to am-private/config.php OUTSIDE public_html. Never commit real values.
return [
 'site_origin'=>'https://amconsorcios.com',
 'base_path'=>'/homologacao', // '' when publishing at the domain root
 'username'=>'AM',
 'password_hash'=>'', // password_hash($chosenPassword, PASSWORD_DEFAULT)
 'data_key'=>'', // base64_encode(random_bytes(32)); preserve when updating
 'db'=>['host'=>'localhost','name'=>'','user'=>'','password'=>''],
];
