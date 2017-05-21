<?php

session_start();
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

if (!isset($_SESSION['user'])) {
    $_SESSION['user'] = array();
}

$twig = $app->view()->getEnvironment();
$twig->addGlobal('user', $_SESSION['user']);



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
    // generating
    if ($error) {
        $app->render('login.html.twig', array("error" => true));
    } else {
        unset($user['password']);
        $_SESSION['user'] = $user;
        $app->render('login_success.html.twig');
    }
});


$app->get('/login_success', function() use ($app) {
   
    $app->render('login_success.html.twig');
     print_r(_SESSION['user']);
});

$app->get('/master', function() use ($app) {
    $app->render('master.html.twig');
});


$app->get('/list', function() use ($app) {

// format for web api output
    $format = 'snbac1p2opl1vhgkj';
// 
    $stocks = "http://download.finance.yahoo.com/d/quotes.csv?s=AAPL,TD,BAC,C,TSLA,WFC,F,EBAY,JPM,GOOG,FAS&f={$format}";

//getting data from csv file into database
//opening csv file
    $handle = fopen($stocks, 'r');
//reading csv file
    while (($data = fgetcsv($handle)) !== FALSE) {

// insert or update the database using associative array
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
//closing cvs file
    fclose($handle);
//getting data from database
    $getquotes = DB::query("SELECT * FROM symbols GROUP BY id DESC");
    // print_r($getquotes);
    $app->render("list.html.twig", ["symbols" => $getquotes]);
});

$app->post('/list', function() use ($app) {

    //inputing symbol from UI
    $stockList = $app->request()->post('symbol');

    // format for web api output
    $format = 'snbac1p2opl1vhgkj';
// 
    $stocks = "http://download.finance.yahoo.com/d/quotes.csv?s={$stockList}&f={$format}";

//getting data from csv file into database
//opening csv file
    $handle = fopen($stocks, 'r');
//reading csv file
    while (($data = fgetcsv($handle)) !== FALSE) {

// insert or update the database using associative array
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
//closing cvs file
    fclose($handle);

    //getting data from database
    $getquotes = DB::query("SELECT * FROM symbols GROUP BY id DESC");
    // print_r($getquotes);
    $app->render("list.html.twig", ["symbols" => $getquotes]);
});

$app->get('/history', function() use ($app) {
    $app->render('history.html.twig');
});

$app->post('/history', function() use ($app) {
//$stockList = $_POST['symbol'];
    $stockList = $app->request()->post('symbol');
  
    $i = 0;

    // https://www.google.com/finance/historical?output=csv&q=aapl
    $requestUrl = "https://app.quotemedia.com/quotetools/getHistoryDownload.csv?&webmasterId=501&startDay=02&startMonth=03&startYear=2017&endDay=10&endMonth=05&endYear=2017&isRanged=false&symbol=" . $stockList;

    $handle = fopen($requestUrl, "r");


    while (($data = fgetcsv($handle, 2000, ",")) !== FALSE) {
        if ($i > 0) {

            DB::insertUpdate('history', array(
                'date' => $data[0],
                'openPrice' => $data[1],
                'high' => $data[2],
                'low' => $data[3],
                'closePrice' => $data[4],
                'volume' => $data[5]
            ));
        }
        $i++;
    }

    fclose($handle);
});

$app->get('/chart', function() use ($app) {

  


    $app->render("chart.html.twig");
});



//buying stock and showing all info
$app->get('/buysellstcok/:id', function($id) use ($app) {
    $stock = DB::queryFirstRow('SELECT * FROM symbols WHERE id=%i', $id);
    $app->render('buysellstcok.html.twig', array(
        't' => $stock
    ));
});


$app->post('/buysellstcok/:id', function($id) use ($app) {
    $stock = DB::queryFirstRow('SELECT * FROM symbols WHERE id=%i', $id);
    $qty = $app->request()->post('qty');
    
    DB::insert('portfolios', array(
                "userId" => $_SESSION['user']['id'],
                "symbol" => $stock['symbol'],
                "avgprice" => $stock['ask'],
                "qty"=>$qty
            ));
    
    
})

;








$app->run();

