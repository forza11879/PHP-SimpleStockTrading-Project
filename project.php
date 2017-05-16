<?php

//y1hkj2pyxx4xgls1
require_once 'vendor/autoload.php';
DB::$host = '127.0.0.1';
DB::$user = 'stocksimulator';
DB::$password = 'bUz0FlWwASZEnDgZ';
DB::$dbName = 'stocksimulator';
DB::$encoding = 'utf8';
DB::$port = 3333;

//tradeapp

//cp4776_tradingapp

// Slim creation and setup
$app = new \Slim\Slim(array(
    'view' => new \Slim\Views\Twig()
        ));

$view = $app->view();
$view->parserOptions = array(
    'debug' => true,
    'cache' => dirname(__FILE__) . '/cache'
);
$view->setTemplatesDirectory(dirname(__FILE__) . '/templates');

if (!isset($_SESSION['todouser'])) {
    $_SESSION['todouser'] = array();
}

$twig = $app->view()->getEnvironment();
$twig->addGlobal('todouser', $_SESSION['todouser']);


/*
//quotes
$client = new GuzzleHttp\Client();

$symbols_count_result = $db->query("SELECT COUNT(id) FROM symbols");
$symbol_row = $symbols_count_result->fetch_row();
$symbol_count = $symbol_row[0];

$api_limit = 200;

$loop_times = $symbol_count / $api_limit;
$loop_times = floor($loop_times) + 1;

$file = 'uploads/csv/stocks.csv';
file_put_contents($file, '');

$format = 'sabo';

for($x = 0; $x < $loop_times; $x++){

    $from = $x * $api_limit;
    $symbols_result = $db->query("SELECT * FROM symbols LIMIT '$api_limit' OFFSET '$from'");

    if($symbols_result->num_rows > 0){

        $symbols = array();
        while($row = $symbols_result->fetch_object()){
            $symbols[] = $row->symbol;
        }
        $symbols_str = implode(',', $symbols);
        $stocks = $client->get("http://download.finance.yahoo.com/d/quotes.csv?s={$symbols_str}&f={$format}");

        file_put_contents($file, $stocks->getBody(), FILE_APPEND);
    }
}

*/
//register
$app->get('/register', function() use ($app) {
    $app->render('register.html.twig');
});

$app->post('/register', function() use($app){

   $email=$app->request()->post('email');
   $name=$app->request()->post('name');
   $pass1=$app->request()->post('pass1');
   $pass2=$app->request()->post('pass2');
   //ask teacher about this line
   // check for errors and collect error messages
   $valueList = array('email' => $email);
   
   $errorList=array();
   
   if(filter_var($email, FILTER_VALIDATE_EMAIL)==FALSE){
       array_push($errorList, "Email is invlad");
   }else {
       $user=DB::queryFirstRow("SELECT * FROM users WHERE email=%s", $email);
       if($user){
           array_push($errorList, "Email address already in use");
       }
       
   }
   
   if ($pass1!=$pass2){
       array_push($errorList, "Password do not match");
   }else{
       if (strlen($pass1) < 6) {
            array_push($errorList, "Password too short, must be 6 characters or longer");
        } 
        if (preg_match('/[A-Z]/', $pass1) != 1
         || preg_match('/[a-z]/', $pass1) != 1
         || preg_match('/[0-9]/', $pass1) != 1) {
            array_push($errorList, "Password must contain at least one lowercase, "
                    . "one uppercase letter, and a digit");
        }
    }
    
    if ($errorList) {
        $app->render('register.html.twig', array(
            'errorList' => $errorList,
            'v' => $valueList
        ));
    } else {
        DB::insert('users', array(
            'email' => $email,
            'name'=> $name,
            'password' => $pass1,
            'cash'=>50000,
            'equity'=>50000
        ));
        $app->render('register_success.html.twig');
    }
      
});

$app->get('/ajax/emailused/:email', function($email) {
    $user = DB::queryFirstRow("SELECT * FROM users WHERE email=%s", $email);
    //echo json_encode($user, JSON_PRETTY_PRINT);
    echo json_encode($user != null);    
});


$app->get('/login', function() use ($app) {
    $app->render('login.html.twig');
});


$app->post('/login', function() use ($app) {
    $email=$app->request()->post('email');
    $pass=$app->request()->post('password');
    
    $error = false;
    $user = DB::queryFirstRow("SELECT * FROM users WHERE email=%s", $email);
    if (!$user) {
        $error = true;
    } else {
        if ($user['password'] != $pass) {
            $error = true;
        }
    }
    
        // decide what to render
    if ($error) {
        $app->render('login.html.twig', array("error" => true));
    } else {
        unset($user['password']);
        $_SESSION['user'] = $user;
        $app->render('login_success.html.twig');
    }

});



$app->run();