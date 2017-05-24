<?php
require_once 'vendor/autoload.php';

DB::$host = 'localhost';
DB::$user = 'stocksimulator';
DB::$password = 'bUz0FlWwASZEnDgZ';
DB::$dbName = 'stocksimulator';
DB::$encoding = 'utf8';
DB::$port = 3333;

   
  $data = DB::query("SELECT date, openPrice,high,low,closePrice FROM history GROUP BY IdHistory DESC");

  //print_r($data);
  
  
//looping through $data
   while ($data !==FALSE) {
        

//            $data[0] = date('d-m-Y', strtotime($data[0]));
//            $data[1] = floatval($data[1]);
//            $data[2] = floatval($data[2]);
//            $data[3] = floatval($data[3]);
//            $data[4] = floatval($data[4]);
       
//            $data[0] = strtotime($data[0])*1000;
//            $data[1] = floatval($data[1]);
//            $data[2] = floatval($data[2]);
//            $data[3] = floatval($data[3]);
//            $data[4] = floatval($data[4]);
       
            $data[0] = strtotime($data[0])*1000;
            $data[1] = floatval($data[1]);
            $data[2] = floatval($data[2]);
            $data[3] = floatval($data[3]);
            $data[4] = floatval($data[4]);
            
         //Create an array 
            $chartArray[] = $data;
            
      
    }
    
    //print_r($chartArray);

    //Convert PHP Array to reverse JSON String
   
    print (json_encode($chartArray));
  


?>

