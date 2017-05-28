<?php

session_start();
//y1hkj2pyxx4xgls1
require_once 'vendor/autoload.php';

require 'local.php';

use Monolog\Logger;
use Monolog\Handler\StreamHandler;

// create a log channel
$log = new Logger('main');
$log->pushHandler(new StreamHandler('logs/everything.log', Logger::DEBUG));
$log->pushHandler(new StreamHandler('logs/errors.log', Logger::ERROR));



//require_once 'local.php';
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
$twig->addGlobal('sessionUser', $_SESSION['user']);



$app->get('/landing', function() use ($app) {
   
   
    
    $app->render('landing.html.twig');
});

$app->post('/landing', function() use ($app) {
   
    if (!$_SESSION['user']) {
        $app->render('login.html.twig');
        return;
    }
    
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


//login

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
   //print_r(_SESSION['user']);
});




$app->get('/master', function() use ($app) {
    
    $userinuse = DB::queryFirstRow('SELECT * FROM users WHERE id=%i', $_SESSION['user']['id']);
    
    
    if (!$_SESSION['user']) {
        $app->render('login.html.twig');
        return;
    }
    
    $app->render('master.html.twig', array('u'=>$userinuse 
    ));
});

//logout

$app->get('/logout', function() use ($app) {
    unset($_SESSION['user']);
    $app->render("logout_success.html.twig");
});

//list
$app->get('/list', function() use ($app) {
    
    $userinuse = DB::queryFirstRow('SELECT * FROM users WHERE id=%i', $_SESSION['user']['id']);
   
     if (!$_SESSION['user']) {
        $app->render('login.html.twig');
        return;
    }
    
    

// format for web api output
    $format = 'snbaopl1hgvkj';
// 
    //$stocks = "http://download.finance.yahoo.com/d/quotes.csv?s=AAPL,TD,BAC,C,TSLA,WFC,F,EBAY,GOOG,FAS,XLF,ADSK,QQQ,FAZ&f={$format}";
    $stocks = "http://download.finance.yahoo.com/d/quotes.csv?s=AAPL&f={$format}";

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
    $app->render("list.html.twig", array("symbols" => $getquotes, "u"=> $userinuse));
});

$app->post('/list', function() use ($app) {
    
   

//inputing symbol from UI
    $stockList = $app->request()->post('symbol');

// format for web api output
    $format = 'snbaopl1hgvkj';
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


$app->get('/fetch/:symbol', function($symbol) use ($app) {

    $i = 0;
//$stocks = "https://app.quotemedia.com/quotetools/getHistoryDownload.csv?&webmasterId=501&startDay=02&startMonth=03&startYear=2017&endDay=10&endMonth=05&endYear=2017&isRanged=false&symbol=aapl";
    $stocks = "https://www.google.com/finance/historical?output=csv&q=" . $symbol;

//getting data from csv file into database
//reading csv file
    $handle = fopen($stocks, 'r');
//creating an array
//$chartArray = array();
//looping through CSV file
    while (($data = fgetcsv($handle, 2000, ",")) !== FALSE) {

        if ($i > 0) {


            //$data[0] = date('d-m-Y', strtotime($data[0]));
            //$data[0] = date('M j, Y', Date.parse($data[0]));
            //$data[0] = date('M j, Y', strtotime($data[0]));
            $data[0] = strtotime($data[0]) * 1000;
            $data[1] = floatval($data[1]);
            $data[2] = floatval($data[2]);
            $data[3] = floatval($data[3]);
            $data[4] = floatval($data[4]);
            //$data[5] = intval($data[5]);
            //Create an array 
            $chartArray[] = $data;
        }
        $i++;
    }

//print_r($chartArray);

    fclose($handle);

//Convert PHP Array to reverse JSON String

    print (json_encode(array_reverse($chartArray)));
});

$app->get('/chart/:symbol', function($symbol) use ($app) {
    $app->render("chart.html.twig", array('symbol' => $symbol));
});

//chart2

$app->get('/chart2/:symbol', function($symbol) use ($app) {

    $app->render("chart2.html.twig", array('symbol' => $symbol));
});




//buying stock and showing all info
$app->get('/buysell/:id', function($id) use ($app) {
    
    
    $stock = DB::queryFirstRow('SELECT * FROM symbols WHERE id=%i', $id);

    $userinuse = DB::queryFirstRow('SELECT * FROM users WHERE id=%i', $_SESSION['user']['id']);
    $stcokownedbyuser = DB::queryFirstRow('SELECT * FROM portfolios WHERE userId=%i AND symbol=%s', $_SESSION['user']['id'], $stock['symbol']);

    

    if ($stock['ask'] != 0) {
        $maxbuy = floor($userinuse['cash'] / $stock['ask']);
    } else {

        $maxbuy = 0;
    }



    if ($stcokownedbyuser) {

        $maxsell = floor($stcokownedbyuser['qty']);
    } else {
        $maxsell = 0;
    }


    $app->render('buysell.html.twig', array(
        't' => $stock, 'maxbuy' => $maxbuy, 'maxsell' => $maxsell, 'u'=>$userinuse
            
            
    ));
    
});


$app->post('/buysell/:id', function($id) use ($app) {

    //echo ("<script>window.alert('Transaction Proccesed')</script>");
    
  
    
    date_default_timezone_set('America/New_York');

    $stock = DB::queryFirstRow('SELECT * FROM symbols WHERE id=%i', $id);
    $qty = $app->request()->post('qty');
    $date = date('Y-m-d H:i:s');
    $userinuse = DB::queryFirstRow('SELECT * FROM users WHERE id=%i', $_SESSION['user']['id']);
    $transactiontotalbuy = $qty * $stock['ask'];
    $transactiontotalsell = $qty * $stock['bid'];
    $stcokownedbyuser = DB::queryFirstRow('SELECT * FROM portfolios WHERE userId=%i AND symbol=%s', $_SESSION['user']['id'], $stock['symbol']);

    $type = $app->request()->post('type');
    //print_r($type);


    if ($type == 'buy') {

        $usernewcash = $userinuse['cash'] - $transactiontotalbuy;


//////cheking if user already bought elected stock
        if ($stcokownedbyuser) {

            $newqty = $qty + $stcokownedbyuser['qty'];
            $newavg = (($stcokownedbyuser['qty'] * $stcokownedbyuser['avgprice']) + ($qty * $stock['ask'])) / $newqty;

            DB::update('portfolios', array(
                "qty" => $newqty,
                "avgprice" => $newavg
                    ), "userId=%i AND symbol=%s", $_SESSION['user']['id'], $stock['symbol']);
        } else {
            DB::insert('portfolios', array(
                "userId" => $_SESSION['user']['id'],
                "symbol" => $stock['symbol'],
                "avgprice" => $stock['ask'],
                "qty" => $qty
            ));
        }
////// end cheking if user alreadybought elected stock/////
    } else {

        $newqty = $stcokownedbyuser['qty'] - $qty;
        $usernewcash = $userinuse['cash'] + $transactiontotalsell;
        DB::update('portfolios', array(
            "qty" => $newqty
                ), "userId=%i AND symbol=%s", $_SESSION['user']['id'], $stock['symbol']);
    }




//////// //adding record to trasactions table/////
    DB::insert('transactions', array(
        "userId" => $_SESSION['user']['id'],
        "symbol" => $stock['symbol'],
        "price" => $stock['ask'],
        "qty" => $qty,
        "type" => $type,
        "date" => $date
    ));
/////////////////////end adding record to transactions table///
/////calculating equity////////////
    $listofstockstocalculateequity = DB::query('SELECT s.symbol, p.qty, s.bid FROM portfolios p, symbols s WHERE p.symbol = s.symbol AND p.userId=%i', $_SESSION['user']['id']);
    //print_r($listofstockstocalculateequity);
    $total = 0;
    foreach ($listofstockstocalculateequity as $stockownedbyuser) {
        $total = $stockownedbyuser['qty'] * $stockownedbyuser['bid'] + $total;
    }

    $newequity = $total + $usernewcash;
/////end calculating equity////////////////
///////////////////////updating user cash AND EQUITY///////////////
    DB::update('users', array(
        "cash" => $usernewcash,
        "equity" => $newequity
            ), "id=%i", $_SESSION['user']['id']);
//////////////////////end updating user cash//////////////
    
    $app->render('list.html.twig');
});

//Order Details

$app->get('/orders', function() use ($app) {
    
    if (!$_SESSION['user']) {
        $app->render('login.html.twig');
        return;
    }

    //getting data from database
    $getOrderDetails = DB::query("SELECT * FROM transactions WHERE userId = %i GROUP BY date DESC", $_SESSION['user']['id']);
// print_r($getquotes);
  
    
    $app->render("orders.html.twig", ["transactions" => $getOrderDetails]);
});

//Portfolio

$app->get('/portfolio', function() use ($app) {
    
    if (!$_SESSION['user']) {
        $app->render('login.html.twig');
        return;
    }

    //getting data from database
    //$getPortfolio = DB::query("SELECT * FROM portfolios WHERE userId = %i GROUP BY symbol", $_SESSION['user']['id']);
    $getPortfolio = DB::query('SELECT s.symbol, p.avgprice, s.bid, p.qty  FROM portfolios p, symbols s WHERE p.symbol = s.symbol AND p.userId=%i', $_SESSION['user']['id']);

    
    $app->render("portfolio.html.twig", ["portfolios" => $getPortfolio]);
});

// PASSWOR RESET

function generateRandomString($length = 10) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, $charactersLength - 1)];
    }
    return $randomString;
}

$app->map('/passreset', function () use ($app, $log) {
// Alternative to cron-scheduled cleanup
    if (rand(1, 1000) == 111) {
// TODO: do the cleanup 1 in 1000 accessed to /passreset URL
    }
    if ($app->request()->isGet()) {
        $app->render('passreset.html.twig');
    } else {
        $email = $app->request()->post('email');
        $user = DB::queryFirstRow("SELECT * FROM users WHERE email=%s", $email);
        if ($user) {
            $app->render('passreset_success.html.twig');
            $secretToken = generateRandomString(50);
// VERSION 1: delete and insert
            /*
              DB::delete('passresets', 'userID=%d', $user['ID']);
              DB::insert('passresets', array(
              'userID' => $user['ID'],
              'secretToken' => $secretToken,
              'expiryDateTime' => date("Y-m-d H:i:s", strtotime("+5 hours"))
              )); */
// VERSION 2: insert-update TODO
            DB::insertUpdate('passresets', array(
                'userID' => $user['ID'],
                'secretToken' => $secretToken,
                'expiryDateTime' => date("Y-m-d H:i:s", strtotime("+5 minutes"))
            ));
// email user
            $url = 'http://' . $_SERVER['SERVER_NAME'] . '/passreset/' . $secretToken;
            $html = $app->view()->render('email_passreset.html.twig', array(
                'name' => $user['name'],
                'url' => $url
            ));
            $headers = "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
            $headers .= "From: Noreply <noreply@ipd8.info>\r\n";
            $headers .= "To: " . htmlentities($user['name']) . " <" . $email . ">\r\n";

            mail($email, "Password reset from SlimShop", $html, $headers);
            $log->info("Password reset for $email email sent");
        } else {
            $app->render('passreset.html.twig', array('error' => TRUE));
        }
    }
})->via('GET', 'POST');

$app->map('/passreset/:secretToken', function($secretToken) use ($app) {
    $row = DB::queryFirstRow("SELECT * FROM passresets WHERE secretToken=%s", $secretToken);
    if (!$row) {
        $app->render('passreset_notfound_expired.html.twig');
        return;
    }
    if (strtotime($row['expiryDateTime']) < time()) {
        $app->render('passreset_notfound_expired.html.twig');
        return;
    }
//
    if ($app->request()->isGet()) {
        $app->render('passreset_form.html.twig');
    } else {
        $pass1 = $app->request()->post('pass1');
        $pass2 = $app->request()->post('pass2');
// TODO: verify password quality and that pass1 matches pass2
        $errorList = array();
        $msg = verifyPassword($pass1);
        if ($msg !== TRUE) {
            array_push($errorList, $msg);
        } else if ($pass1 != $pass2) {
            array_push($errorList, "Passwords don't match");
        }
//
        if ($errorList) {
            $app->render('passreset_form.html.twig', array(
                'errorList' => $errorList
            ));
        } else {
// success - reset the password
            DB::update('users', array(
                'password' => password_hash($pass1, CRYPT_BLOWFISH)
                    ), "ID=%d", $row['userID']);
            DB::delete('passresets', 'secretToken=%s', $secretToken);
            $app->render('passreset_form_success.html.twig');
            $log->info("Password reset completed for " . $row['email'] . " uid=" . $row['userID']);
        }
    }
})->via('GET', 'POST');


$app->get('/scheduled/daily', function() use ($app, $log) {
    DB::$error_handler = FALSE;
    DB::$throw_exception_on_error = TRUE;
// PLACE THE ORDER
    $log->debug("Daily scheduler run started");
// 1. clean up old password reset requests
    try {
        DB::delete('passresets', "expiryDateTime < NOW()");
        $log->debug("Password resets clean up, removed " . DB::affectedRows());
    } catch (MeekroDBException $e) {
        sql_error_handler(array(
            'error' => $e->getMessage(),
            'query' => $e->getQuery()
        ));
    }
// 2. clean up old cart items (normally we never do!)
    try {
        DB::delete('cartitems', "createdTS < DATE(DATE_ADD(NOW(), INTERVAL -1 DAY))");
    } catch (MeekroDBException $e) {
        sql_error_handler(array(
            'error' => $e->getMessage(),
            'query' => $e->getQuery()
        ));
    }
    $log->debug("Cart items clean up, removed " . DB::affectedRows());
    $log->debug("Daily scheduler run completed");
    echo "Completed";
});









$app->run();
