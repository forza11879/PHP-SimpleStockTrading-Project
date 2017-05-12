<?php

//y1hkj2pyxx4xgls1
require_once 'vendor/autoload.php';
DB::$host = '127.0.0.1';
DB::$user = 'slimtodo';
DB::$password = 'q7nX9BLhDnPUeO9Q';
DB::$dbName = 'slimtodo';
DB::$encoding = 'utf8';
DB::$port = 3333;

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


$app->run();