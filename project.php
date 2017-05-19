<?php

//y1hkj2pyxx4xgls1
require_once 'vendor/autoload.php';

use Monolog\Logger;
use Monolog\Handler\StreamHandler;

// create a log channel
$log = new Logger('main');
$log->pushHandler(new StreamHandler('logs/everything.log', Logger::DEBUG));
$log->pushHandler(new StreamHandler('logs/errors.log', Logger::ERROR));



DB::$host = 'localhost';
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



$app->get('/landing', function() use ($app) {
    $app->render('landing.html.twig');
});




//register
$app->get('/register', function() use ($app) {
    $app->render('register.html.twig');
});

$app->post('/register', function() use($app) {

    $email = $app->request()->post('email');
    $name = $app->request()->post('name');
    $pass1 = $app->request()->post('pass1');
    $pass2 = $app->request()->post('pass2');
    //ask teacher about this line
    // check for errors and collect error messages
    $valueList = array('email' => $email);

    $errorList = array();

    if (filter_var($email, FILTER_VALIDATE_EMAIL) == FALSE) {
        array_push($errorList, "Email is invlad");
    } else {
        $user = DB::queryFirstRow("SELECT * FROM users WHERE email=%s", $email);
        if ($user) {
            array_push($errorList, "Email address already in use");
        }
    }

    if ($pass1 != $pass2) {
        array_push($errorList, "Password do not match");
    } else {
        if (strlen($pass1) < 6) {
            array_push($errorList, "Password too short, must be 6 characters or longer");
        }
        if (preg_match('/[A-Z]/', $pass1) != 1 || preg_match('/[a-z]/', $pass1) != 1 || preg_match('/[0-9]/', $pass1) != 1) {
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
            'name' => $name,
            'password' => $pass1,
            'cash' => 50000,
            'equity' => 50000
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
    $email = $app->request()->post('email');
    $pass = $app->request()->post('password');

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

$app->get('/master', function() use ($app) {
    $app->render('master.html.twig');
});


$app->get('/list', function() use ($app) {
    // calling GuzzleHttp Library
    $client = new GuzzleHttp\Client();
    
    //Declare the file path of the csv file in which will save all the results from the API
    $file = 'uploads/csv/stocks.csv';
//Initialize csv file by setting its value to an empty string.
    file_put_contents($file, '');
// format for web api output
    $format = 'snbac1p2opl1vhgkj';
//get data from web api link - {$symbols_str}

$stocks = $client->get("http://download.finance.yahoo.com/d/quotes.csv?s=AAPL,TD,BAC,C,TSLA,WFC,F,EBAY,JPM&f={$format}");

//add data into csv file
    file_put_contents($file, $stocks->getBody(), FILE_APPEND);

//getting data from csv file into database
//reading csv file
    $fp = fopen($file, 'r');
    $datas = array();
    while (($data = fgetcsv($fp)) !== FALSE) {

        $data['symbol'] = trim($data[0]);
        $data['name'] = trim($data[1]);
        $data['bid'] = trim($data[2]);
        $data['ask'] = trim($data[3]);
        $data['open'] = trim($data[4]);
        $data['previousClose'] = trim($data[5]);
        $data['lastTrade'] = trim($data[6]);
        $data['high'] = trim($data[7]);
        $data['low'] = trim($data[8]);
        $data['volume'] = trim($data[9]);
        $data['high52'] = trim($data[10]);
        $data['low52'] = trim($data[11]);
        $datas[] = $data;
        
        
// insert or update the database
        DB::insertUpdate('symbols', array(
            'symbol' => $data[0],
            'name' => $data[1],
            'bid' => $data[2],
            'ask' => $data[3],
            'open' => $data[4],
            'previousClose' => $data[5],
            'lastTrade' => $data[6],
            'high' => $data[7],
            'low' => $data[8],
            'volume' => $data[9],
            'high52' => $data[10],
            'low52' => $data[11],
        ));
    }
    
    $getquotes = DB::query("SELECT * FROM symbols");
   // print_r($getquotes);
    $app->render("list.html.twig", ["symbols" => $getquotes]);
});

$app->get('/search', function() use ($app) {
    $app->render('search.html.twig');
});

$app->post('/search', function() use ($app) {
    //$stockList = $_POST['symbol'];
    $stockList = $app->request()->post('symbol');
    
//$stockFormat = "snbaopl1vhgkj";
$stockFormat = "snab";

$requestUrl = "http://quote.yahoo.com/d/quotes.csv?s=".$stockList."&amp;amp;amp;amp;f=".$stockFormat."&amp;amp;amp;amp;e=.csv";

// Pull data (download CSV as file)
$filesize=2000;
$handle = fopen($requestUrl, "r");
$raw = fread($handle, $filesize);
fclose($handle);
 
// Split results, trim way the extra line break at the end
$quotes = explode("\n",trim($raw));
 
foreach($quotes as $quoteraw) {
$quoteraw = str_replace(", I", " I", $quoteraw);
$quote = explode(",", $quoteraw);

echo     $quote[0] ."". $quote[1] ."". $quote[2] ." - ". $quote[3]; 

}
 
    
});



$app->run();

